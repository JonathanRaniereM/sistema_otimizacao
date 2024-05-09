import numpy as np
import sympy as sp
# from scipy.optimize import minimize
# import matplotlib.pyplot as plt
import json

def compile_sympy_expression(expr_str, variables):
    expr_str = expr_str.replace("^", "**")
    sympy_expr = sp.sympify(expr_str)
    return sp.lambdify(variables, sympy_expr, modules=['numpy'])

def gradient_of_function(expr_str, variables):
    expr = sp.sympify(expr_str)
    gradient = [sp.diff(expr, var) for var in variables]
    return sp.lambdify(variables, gradient, 'numpy')

def evaluate_on_grid(expr_str, variables, x_range, y_range):
    f = compile_sympy_expression(expr_str, variables)
    X, Y = np.meshgrid(x_range, y_range, indexing='ij')
    Z = f(X, Y)
    return X, Y, Z


def gradient_descent_method(objective_function, gradient_function, x0, max_iter, learning_rate=0.01):
    path = [x0]
    x = np.array(x0)
    for _ in range(max_iter):
        grad = np.array(gradient_function(*x))
        x = x - learning_rate * grad
        path.append(x.tolist())
    values = [objective_function(*p) for p in path]
    return {"x": [p[0] for p in path], "y": [p[1] for p in path], "values": values}


def method_random_and_method_gradient(data):
    objective_function_str = data['objective_function_str']
    variables = sp.symbols('x y')
    bounds = np.array(data['bounds'])
    max_iter = data['max_iter']

    x_range = np.linspace(bounds[0][0], bounds[0][1], 100)
    y_range = np.linspace(bounds[1][0], bounds[1][1], 100)
    X, Y, Z = evaluate_on_grid(objective_function_str, variables, x_range, y_range)

    x0 = [(b[0] + b[1]) / 2 for b in bounds]
    objective_function = compile_sympy_expression(objective_function_str, variables)
    gradient_function = gradient_of_function(objective_function_str, variables)

    gradient_results = gradient_descent_method(objective_function, gradient_function, x0, max_iter)

    x = np.array(x0)
    learning_rate = 0.01
    path = [x.tolist()]
    for _ in range(max_iter):
        grad = np.array(gradient_function(*x))
        x = x - learning_rate * grad
        path.append(x.tolist())

    values = [objective_function(*p) for p in path]
    gradient_descent_results = {"x": [p[0] for p in path], "y": [p[1] for p in path], "values": values}

    random_results = {"x": [], "y": [], "values": []}
    for _ in range(max_iter):
        random_point = [np.random.uniform(b[0], b[1]) for b in bounds]
        random_results["x"].append(random_point[0])
        random_results["y"].append(random_point[1])
        random_results["values"].append(objective_function(*random_point))

    # Calculate the optimal point using the last point from gradient descent method
    optimal_point = gradient_results

    convergence_curve_random = {
        "iter": list(range(max_iter)),
        "values": random_results["values"],
        "type": "random"
    }

    convergence_curve_gradient = {
        "iter": list(range(max_iter)),
        "values": gradient_results["values"],
        "type": "gradient"
    }

    convergence_curve_gradient_descent = {
        "iter": list(range(max_iter)),
        "values": gradient_descent_results["values"],
        "type": "gradient_descent"
    }

    result_data = {
        "function_3d": {"x": x_range.tolist(), "y": y_range.tolist(), "z": Z.tolist()},
        "gradient_trajectory": {"x": gradient_results["x"], "y": gradient_results["y"], "values": gradient_results["values"]},
        "gradient_descent_trajectory": {"x": gradient_descent_results["x"], "y": gradient_descent_results["y"], "values": gradient_descent_results["values"]},
        "random_trajectory": {"x": random_results["x"], "y": random_results["y"], "values": random_results["values"]},
        "convergence_curve": [convergence_curve_random, convergence_curve_gradient, convergence_curve_gradient_descent],
        "feasibility_region": {
            "x": X.tolist(),
            "y": Y.tolist(),
            "z": (Z < 100).astype(int).tolist()
        },
        "optimization": {
            "gradient_solution": gradient_results["x"][-1],
            "gradient_value": gradient_results["values"][-1],
            "gradient_descent_solution": gradient_descent_results["x"][-1],
            "gradient_descent_value": gradient_descent_results["values"][-1],
            "random_solution": random_results["x"][-1],
            "random_value": random_results["values"][-1],
            "optimal_point": {"x": gradient_results["x"][-1], "y": gradient_results["y"][-1], "value": gradient_results["values"][-1]}
        }
    }

    return json.dumps(result_data)

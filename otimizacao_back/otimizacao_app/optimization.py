import numpy as np
import sympy as sp
import json

def compile_sympy_expression(expr_str, variables):
    expr_str = expr_str.replace("^", "**")
    sympy_expr = sp.sympify(expr_str)
    return sp.lambdify(variables, sympy_expr, modules=['numpy'])

def evaluate_on_grid(expr_str, variables, x_range, y_range):
    f = compile_sympy_expression(expr_str, variables)
    X, Y = np.meshgrid(x_range, y_range, indexing='ij')
    Z = f(X, Y)
    return X, Y, Z

def numerical_gradient(f, x, h=1e-8):
    grad = np.zeros_like(x)
    for i in range(len(x)):
        x_i_h = np.copy(x)
        x_i_h[i] += h
        grad[i] = (f(*x_i_h) - f(*x)) / h
    return grad

def gradient_descent_method(objective_function, x0, max_iter, learning_rate=0.1, tolerance=1e-6):
    path = [x0]
    x = np.array(x0)
    for _ in range(max_iter):
        grad = numerical_gradient(objective_function, x)
        x_new = x - learning_rate * grad
        path.append(x_new.tolist())
        if np.linalg.norm(grad) < tolerance:
            print(f"Convergência alcançada após {_+1} iterações.")
            break
        x = x_new
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

    x0 = [6.7, 2.1]
    objective_function = compile_sympy_expression(objective_function_str, variables)

    gradient_results = gradient_descent_method(objective_function, x0, max_iter)
    
    optimal_point = np.array([gradient_results['x'][-1], gradient_results['y'][-1]])  # Último ponto do método de gradiente
    tolerance = 0.9

    random_results = {"x": [], "y": [], "values": []}
    for _ in range(max_iter):
        random_point = np.array([np.random.uniform(b[0], b[1]) for b in bounds])
        value = objective_function(*random_point)
        random_results["x"].append(random_point[0])
        random_results["y"].append(random_point[1])
        random_results["values"].append(value)
        
        if np.linalg.norm(random_point - optimal_point) < tolerance:
            print(f"Convergência alcançada no método aleatório após {_+1} iterações.")
            break

    convergence_curve_random = {
        "iter": list(range(len(random_results["values"]))),
        "values": random_results["values"],
        "type": "random"
    }

    convergence_curve_gradient = {
        "iter": list(range(len(gradient_results["values"]))),
        "values": gradient_results["values"],
        "type": "gradient"
    }

    result_data = {
        "function_3d": {"x": x_range.tolist(), "y": y_range.tolist(), "z": Z.tolist()},
        "gradient_trajectory": {"x": gradient_results["x"], "y": gradient_results["y"], "values": gradient_results["values"]},
        "random_trajectory": {"x": random_results["x"], "y": random_results["y"], "values": random_results["values"]},
        "convergence_curve": [convergence_curve_random, convergence_curve_gradient],
        "feasibility_region": {
            "x": X.tolist(),
            "y": Y.tolist(),
            "z": (Z < 100).astype(int).tolist()
        },
        "optimization": {
            "gradient_solution": gradient_results["x"][-1],
            "gradient_value": gradient_results["values"][-1],
            "random_solution": random_results["x"][-1],
            "random_value": random_results["values"][-1],
            "optimal_point": {"x": gradient_results["x"][-1], "y": gradient_results["y"][-1], "value": gradient_results["values"][-1]}
        }
    }

    return json.dumps(result_data)

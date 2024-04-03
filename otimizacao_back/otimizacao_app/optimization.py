import numpy as np
from scipy.optimize import minimize
import sympy as sp

# Cache para as funções compiladas
compiled_functions_cache = {}

def compile_sympy_expression(expr_str, variables):
    """Compila uma expressão Sympy para uma função numérica."""
    expr_str = expr_str.replace("^", "**")  # Convertendo a expressão para uma forma que o SymPy entenda
    if expr_str not in compiled_functions_cache:
        sympy_expr = sp.sympify(expr_str)
        compiled_function = sp.lambdify(variables, sympy_expr, 'numpy')
        compiled_functions_cache[expr_str] = compiled_function
    return compiled_functions_cache[expr_str]

def evaluate_function(function_str, variables_values):
    """Avalia a função otimizada, convertendo expressões para valores numéricos."""
    function_str = function_str.replace("^", "**")  # Adaptação para interpretar funções em um formato padrão
    variables = sp.symbols(' '.join(['x{}'.format(i) for i, _ in enumerate(variables_values)]))
    compiled_function = compile_sympy_expression(function_str, variables)
    result = compiled_function(*variables_values)
    return result

def safe_gradient(func_str, point):
    """Calcula o gradiente de forma segura e otimizada."""
    func_str = func_str.replace("^", "**")  # Adaptação para interpretar gradiente em formato padrão
    vars_str = ' '.join(['x{}'.format(i) for i, _ in enumerate(point)])
    variables = sp.symbols(vars_str)
    func_expr = sp.sympify(func_str)
    gradient_exprs = [sp.diff(func_expr, var) for var in variables]
    gradient_funcs = [compile_sympy_expression(str(expr), variables) for expr in gradient_exprs]
    grad_values = [grad_func(*point) for grad_func in gradient_funcs]
    return np.array(grad_values, dtype=np.float64)

def random_method(data):
    objective_function_str = data['objective_function_str']
    bounds = data['bounds']
    max_iter = data['max_iter']

    x_range = np.linspace(bounds[0][0], bounds[0][1], 30)
    y_range = np.linspace(bounds[1][0], bounds[1][1], 30)
    X, Y = np.meshgrid(x_range, y_range)
    Z = np.array([evaluate_function(objective_function_str, [x, y]) for x, y in zip(np.ravel(X), np.ravel(Y))]).reshape(X.shape)

    best_solution = None
    best_value = np.inf
    solutions = []

    for _ in range(max_iter):
        initial_point = np.random.uniform(low=[b[0] for b in bounds], high=[b[1] for b in bounds])
        objective_func = lambda x: evaluate_function(objective_function_str, x)
        gradient_func = lambda x: safe_gradient(objective_function_str, x)  # Usando a expressão para o gradiente
        res = minimize(objective_func, initial_point, method='BFGS', jac=gradient_func, options={'maxiter': 1})

        if res.fun < best_value:
            best_solution = res.x
            best_value = res.fun

        solutions.append(res.x)
    
    solution_trajectory = np.array(solutions)

    # Retornando os dados necessários para plotagem
    return {
        "function_3d": {"x": x_range.tolist(), "y": y_range.tolist(), "z": Z.tolist()},
        "contour_levels": {"x": x_range.tolist(), "y": y_range.tolist(), "z": Z.tolist()},
        "solution_trajectory": {
            "x1": solution_trajectory[:, 0].tolist(), 
            "x2": solution_trajectory[:, 1].tolist()
        },
        "solution_trajectory": {
            "x1": solution_trajectory[:, 0].tolist(), 
            "x2": solution_trajectory[:, 1].tolist()
        },
        "convergence_curve": {
            "iterations": list(range(len(solution_trajectory))), 
            "values": [evaluate_function(objective_function_str, x) for x in solution_trajectory]
        },
    }


def newton_method(data):
    # Suponha que `data` inclua a função objetivo e sua Hessiana
    fun = data['objective_function']
    hess = data['hessian']
    
    # Ponto inicial (fornecido ou gerado aleatoriamente dentro da região factível)
    initial_point = data.get('initial_point')

    # Aplica o método de Newton
    res = minimize(fun, initial_point, method='Newton-CG', jac=hess)

    return {
        "coordinates": res.x.tolist(),
        "other_info": {"objective_value": res.fun}
    }

def quasi_newton_method(data):
    fun = data['objective_function']
    initial_point = data.get('initial_point')

    # Utiliza BFGS, um método Quasi-Newton
    res = minimize(fun, initial_point, method='BFGS')

    return {
        "coordinates": res.x.tolist(),
        "other_info": {"objective_value": res.fun}
    }


def barrier_method(data):
    fun = data['objective_function']
    barrier = data['barrier_function']
    initial_point = data.get('initial_point')

    # A função a ser otimizada inclui o termo da barreira
    def objective_with_barrier(x):
        return fun(x) + barrier(x)

    res = minimize(objective_with_barrier, initial_point)

    return {
        "coordinates": res.x.tolist(),
        "other_info": {"objective_value": res.fun}
    }


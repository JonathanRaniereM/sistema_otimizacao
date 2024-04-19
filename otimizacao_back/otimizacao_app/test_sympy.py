import sympy as sp

def compile_sympy_expression(expr_str, variables):
    expr_str = expr_str.replace("^", "**")
    sympy_expr = sp.sympify(expr_str)
    if sympy_expr:
        compiled_function = sp.lambdify(variables, sympy_expr, modules=['numpy'])
        return compiled_function
    else:
        print("Falha na interpretação da expressão.")
        return None

# Teste direto
test_expr = "x^2 + y^2"
variables = sp.symbols("x y")
test_compiled = compile_sympy_expression(test_expr, variables)
if test_compiled is not None:
    print("Teste de compilação bem-sucedido. Resultado da função compilada para (1, 2):", test_compiled(1, 2))
else:
    print("Falha na compilação da expressão.")

from flask import Flask, render_template, request, jsonify
import math
import re

app = Flask(__name__)
calculation_history = []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    data = request.get_json()
    expression = data.get('expression', '')

    if not expression:
        return jsonify({'result': 'Error', 'error': 'Empty expression'}), 400

    replacements = {
        '×': '*', '÷': '/', '−': '-', '–': '-',
        '^': '**', 'π': 'math.pi',
        'sin(': 'sin(', 'cos(': 'cos(', 'tan(': 'tan(',
        'log(': 'log(', 'ln(': 'ln(', '√(': 'sqrt(',
    }

    safe_expr = expression
    for key, value in replacements.items():
        safe_expr = safe_expr.replace(key, value)

    # Fix % : treat as modulo between numbers, as /100 otherwise
    safe_expr = re.sub(r'(\d+\.?\d*)\s*%\s*(?=\d)', lambda m: m.group(0), safe_expr)
    safe_expr = re.sub(r'(\d+\.?\d*)%(?!\s*[\d(])', r'(\1/100)', safe_expr)

    # Fix e: only replace standalone 'e' (not scientific notation like 1e10)
    safe_expr = re.sub(r'(?<![0-9])e(?![0-9])', 'math.e', safe_expr)

    safe_globals = {
        "__builtins__": None,
        "math": math,
        "sin":  lambda x: math.sin(math.radians(x)),
        "cos":  lambda x: math.cos(math.radians(x)),
        "tan":  lambda x: math.tan(math.radians(x)),
        "log":  math.log10,
        "ln":   math.log,
        "sqrt": math.sqrt,
    }

    try:
        result_val = eval(safe_expr, safe_globals, {})

        if isinstance(result_val, (int, float)):
            result_val = round(result_val, 10)
            try:
                if result_val == int(result_val):
                    result_val = int(result_val)
            except (OverflowError, ValueError):
                pass

        result_str = str(result_val)

        calculation_history.insert(0, {'expression': expression, 'result': result_str})
        if len(calculation_history) > 20:
            calculation_history.pop()

        return jsonify({'result': result_str, 'history': calculation_history})

    except Exception as e:
        return jsonify({'result': 'Error', 'error': str(e)}), 400


@app.route('/history', methods=['GET', 'DELETE'])
def history():
    global calculation_history
    if request.method == 'DELETE':
        calculation_history = []
    return jsonify({'history': calculation_history})


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=False)

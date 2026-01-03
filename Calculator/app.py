from flask import Flask, render_template, request, jsonify
import math

app = Flask(__name__)

# In-memory storage for history
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

    # 1. Logic Replacements
    replacements = {
        '×': '*', '÷': '/', '−': '-', '^': '**', 'π': 'math.pi', 'e': 'math.e',
        'sin(': 'math.sin(', 'cos(': 'math.cos(', 'tan(': 'math.tan(',
        'log(': 'math.log10(', 'ln(': 'math.log(', '√(': 'math.sqrt(',
        '%': '/100'
    }

    safe_expr = expression
    for key, value in replacements.items():
        safe_expr = safe_expr.replace(key, value)

    try:
        # 2. Evaluate safely
        result_val = eval(safe_expr, {"__builtins__": None}, {"math": math})
        
        # 3. Formatting
        if isinstance(result_val, (int, float)):
            result_val = round(result_val, 10)
            if result_val == int(result_val):
                result_val = int(result_val)

        result_str = str(result_val)

        # 4. Update History
        log_entry = {'expression': expression, 'result': result_str}
        calculation_history.insert(0, log_entry)
        if len(calculation_history) > 20: # Increased limit slightly
            calculation_history.pop()

        return jsonify({'result': result_str, 'history': calculation_history})

    except Exception as e:
        return jsonify({'result': 'Error', 'error': str(e)}), 400

@app.route('/history', methods=['GET', 'DELETE'])
def history():
    global calculation_history
    
    if request.method == 'DELETE':
        # Clear the history list
        calculation_history = []
        return jsonify({'history': calculation_history})
    
    return jsonify({'history': calculation_history})

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)

// Script para calcular el polinomio interpolante y graficar
let coefficients = [];
let chart; // Variable global para almacenar la referencia al gráfico

let xValues = [];
let yValues = [];
let method;


document.getElementById('calculate-btn').addEventListener('click', function() {
    // Convertir los strings de entrada en arrays de números
    xValues = document.getElementById('x-values').value.split(',').map(Number);
    yValues = document.getElementById('y-values').value.split(',').map(Number);

    method = document.getElementById('method-select').value; // Método seleccionado

    if (xValues.length !== yValues.length) {
        alert("Debe haber la misma cantidad de valores de X y Y.");
        return;
    }

    let polynomialString = '';

    if (method === 'vandermonde') {
        // Método de la Matriz de Vandermonde
        const vandermondeMatrix = buildVandermondeMatrix(xValues);
        // Resolver el sistema para obtener los coeficientes
        coefficients = solveVandermonde(vandermondeMatrix, yValues);
        polynomialString = buildPolynomialString(coefficients); // Mostrar el polinomio en pantalla
    } else if (method === 'lagrange') {
        console.log("LG")
        // Método de Lagrange
        polynomialString = buildLagrangePolynomial(xValues, yValues);
    }

    // Renderizar el polinomio con KaTeX
    katex.render(`P(x) = ${polynomialString}`, document.getElementById('polynomial-result'));

    // Graficar el polinomio y los puntos
    plotPolynomial(xValues, yValues);
});

// Función para construir la matriz de Vandermonde
function buildVandermondeMatrix(xValues) {
    const n = xValues.length;
    const matrix = [];

    for (let i = 0; i < n; i++) {
        const row = [];
        for (let j = 0; j < n; j++) {
            row.push(Math.pow(xValues[i], j)); // x^j
        }
        matrix.push(row);
    }
    return matrix;
}

// Función para resolver el sistema usando eliminación de Gauss
function solveVandermonde(matrix, yValues) {
    const n = matrix.length;
    const augmentedMatrix = matrix.map((row, i) => [...row, yValues[i]]);

    // Eliminación de Gauss
    for (let i = 0; i < n; i++) {
        // Hacer que el pivote sea 1
        const pivot = augmentedMatrix[i][i];
        for (let j = 0; j <= n; j++) {
            augmentedMatrix[i][j] /= pivot;
        }

        // Hacer que los valores de la columna sean 0
        for (let k = 0; k < n; k++) {
            if (k !== i) {
                const factor = augmentedMatrix[k][i];
                for (let j = 0; j <= n; j++) {
                    augmentedMatrix[k][j] -= factor * augmentedMatrix[i][j];
                }
            }
        }
    }

    // Extraer los coeficientes
    const coefficients = augmentedMatrix.map(row => row[n]);
    return coefficients;
}

// Función para construir el polinomio en forma de cadena de texto
function buildPolynomialString(coeffs) {
    let polynomial = "";
    for (let i = 0; i < coeffs.length; i++) {
        if (coeffs[i] !== 0) {
            if (i === 0) {
                polynomial += `${coeffs[i].toFixed(2)}`;
            } else {
                polynomial += ` + (${coeffs[i].toFixed(2)}x^${i})`;
            }
        }
    }
    return polynomial;
}

// Función para construir el polinomio interpolante usando la fórmula de Lagrange
function buildLagrangePolynomial(xValues, yValues) {
const n = xValues.length;
    let polynomial = "";

    for (let i = 0; i < n; i++) {
        let term = `${yValues[i].toFixed(2)}`;
        let numerator = "";
        let denominator = "";

        for (let j = 0; j < n; j++) {
            if (i !== j) {
                numerator += `(x - ${xValues[j].toFixed(2)})`;
                denominator += `(${xValues[i].toFixed(2)} - ${xValues[j].toFixed(2)})`;
            }
        }

        // Incluir el término completo como fracción usando KaTeX
        term = `${term} \\cdot \\frac{${numerator}}{${denominator}}`;

        polynomial += ` + (${term})`;
    }

    // Eliminar el "+" inicial sobrante
    polynomial = polynomial.replace(" + ", "");
    return polynomial;
}

// Evaluar P(x) cuando se ingresa f(x) para hallar x
document.getElementById('find-x-btn').addEventListener('click', function() {
    const fxInput = parseFloat(document.getElementById('input-fx').value); // Valor de f(x) ingresado
    const xMin = Math.min(...xValues) - 1;
    const xMax = Math.max(...xValues) + 1;

    let resultX = null;
    if (method === 'vandermonde') {
        resultX = findXWithBisection(fxInput, xMin, xMax, function(x) {
            return evaluatePolynomial(x, coefficients); // Pasamos los coeficientes
        });
    } else if (method === 'lagrange') {
        resultX = findXWithBisection(fxInput, xMin, xMax, evaluateLagrangePolynomial);
    }

    if (resultX !== null) {
        katex.render(`P(x) = ${fxInput}, \\text{ entonces } x \\approx ${resultX.toFixed(4)}`, document.getElementById('fx-result'));
        plotPolynomial(xValues, yValues, resultX, fxInput);
    } else {
        document.getElementById('fx-result').textContent = "No se encontró una solución en el rango dado.";
    }
});

// Método de bisección para encontrar x dado f(x)
function findXWithBisection(fx, xMin, xMax, evaluatePoly) {
    const tolerance = 0.00001;
    let mid;

    while ((xMax - xMin) / 2 > tolerance) {
        mid = (xMin + xMax) / 2;
        const fMid = evaluatePoly(mid);

        if (Math.abs(fMid - fx) < tolerance) {
            return mid;
        } else if (fMid < fx) {
            xMin = mid;
        } else {
            xMax = mid;
        }
    }

    return (xMin + xMax) / 2;
}

// Evaluar el polinomio P(x) en un valor de x
document.getElementById('evaluate-btn').addEventListener('click', function() {
    method = document.getElementById('method-select').value; // Método seleccionado
    const inputX = parseFloat(document.getElementById('input-x').value);

    let result = 0;
    if (method === 'vandermonde') {
        console.log("VR")
        result = evaluatePolynomial(inputX, coefficients);
    } else if (method === 'lagrange') {
        console.log("LG")
        result = evaluateLagrangePolynomial(inputX);
    }

    katex.render(`P(${inputX}) = ${result.toFixed(6)}`, document.getElementById('px-result'));
    plotPolynomial(xValues, yValues, inputX, result);
});

// Función para evaluar el polinomio en un valor de x
function evaluatePolynomial(x, coeffs) {
    let result = 0;
    for (let i = 0; i < coeffs.length; i++) {
        result += coeffs[i] * Math.pow(x, i);
    }
    return result;
}

// Evaluar el polinomio de Lagrange en un valor de x
function evaluateLagrangePolynomial(x) {
    const xInput = document.getElementById('x-values').value.split(',').map(Number);
    const yInput = document.getElementById('y-values').value.split(',').map(Number);
    const n = xInput.length;
    let result = 0;

    for (let i = 0; i < n; i++) {
        let li = 1;
        for (let j = 0; j < n; j++) {
            if (i !== j) {
                li *= (x - xInput[j]) / (xInput[i] - xInput[j]);
            }
        }
        result += yInput[i] * li;
    }
    return result;
}

// Función para graficar el polinomio y los puntos
function plotPolynomial(xValues, yValues, evalX, evalY) {
    const xMin = Math.min(...xValues) - 1;
    const xMax = Math.max(...xValues) + 1;
    
    // Generar puntos para el polinomio en un rango
    const polyPointsX = [];
    const polyPointsY = [];

    if (method === 'vandermonde') {  
        console.log("VR")
        for (let x = xMin; x <= xMax; x += 0.1) {
            polyPointsX.push(x);
            polyPointsY.push(evaluatePolynomial(x, coefficients));
        }
    } else if (method === 'lagrange') {
        console.log("LG")
        for (let x = xMin; x <= xMax; x += 0.1) {
            polyPointsX.push(x);
            polyPointsY.push(evaluateLagrangePolynomial(x));
        }
    }

    const data = {
        labels: polyPointsX,
        datasets: [
            {
                label: 'Polinomio Interpolante',
                data: polyPointsY,
                borderColor: 'rgba(75, 192, 192, 1)',
                fill: false,
                borderWidth: 2,
                tension: 0.1,
                pointRadius: 0
            },
            {
                label: 'Puntos Ingresados',
                data: xValues.map((x, i) => ({ x: x, y: yValues[i] })),
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 1)',
                type: 'scatter',
                pointRadius: 6,
                pointHoverRadius: 8
            }
        ]
    };

    // Si se ha evaluado un punto, agregarlo al gráfico
    if (evalX !== null && evalY !== null) {
        data.datasets.push({
            label: `P(${evalX})`,
            data: [{ x: evalX, y: evalY }],
            borderColor: 'rgba(0, 255, 0, 1)',
            backgroundColor: 'rgba(0, 255, 0, 0.5)',
            type: 'scatter',
            pointRadius: 8,
            pointHoverRadius: 10
        });
    }

    // Crear o actualizar el gráfico
    const ctx = document.getElementById('polynomialChart').getContext('2d');
    if (chart) {
        chart.destroy(); // Destruir el gráfico anterior si existe
    }
    chart = new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom'
                }
            }
        }
    });
}

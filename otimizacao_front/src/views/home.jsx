import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';

function FunctionInput() {
  const [functionText, setFunctionText] = useState('');
  const [gradientText, setGradientText] = useState('');
  const [bounds, setBounds] = useState('');
  const [maxIter, setMaxIter] = useState('');
  const [plotsData, setPlotsData] = useState({});

  useEffect(() => {
    // Inicializar conexão WebSocket aqui
    const ws = new WebSocket('ws://192.168.254.82:8000/ws/manage_otimize/'); // Ajuste a URL conforme necessário

    ws.onopen = () => {
      console.log('WebSocket Connected');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log(message)
      if (message.type === 'perform_optimization') { // Verifique se esta é a maneira correta de identificar a mensagem
        setPlotsData(message.result);
        console.log("Mensagem Recebida")
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const ws = new WebSocket('ws://192.168.254.82:8000/ws/manage_otimize/'); // Ajuste a URL conforme necessário

    const message = {
        type: "perform_optimization",
        method: 'random',
        action: "optimize",
        data: {
          objective_function_str: functionText,
          gradient_str: gradientText,
          bounds: JSON.parse(bounds),
          max_iter: parseInt(maxIter, 10),
        },
      
    };
    
    

    ws.onopen = () => {
    ws.send(JSON.stringify(message));
    console.log("Essa é a mensagem que estou enviando:",message)
};    ws.onerror = (error) => {
      console.error('WebSocket Error:', error); // Log de erros do WebSocket
    };
  };

  return (
    <div className="function-input-container">
      <h2>Adicione sua função</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={functionText}
          onChange={(e) => setFunctionText(e.target.value)}
          placeholder="Função objetivo, ex: x^2 + 3*x + 2"
        />
        <input
          type="text"
          value={gradientText}
          onChange={(e) => setGradientText(e.target.value)}
          placeholder="Gradiente, ex: [2*x + 3, ...]"
        />
        <input
          type="text"
          value={bounds}
          onChange={(e) => setBounds(e.target.value)}
          placeholder="Limites, ex: [[-10, 10], [-10, 10]]"
        />
        <input
          type="text"
          value={maxIter}
          onChange={(e) => setMaxIter(e.target.value)}
          placeholder="Número máximo de iterações, ex: 100"
        />
        <div>
          <button type="submit">Enviar Dados</button>
        </div>
      </form>
      <div className="plot-area">
        {/* Área de plotagem dos gráficos com Plotly.js virá aqui */}
      </div>
    </div>
  );
}

export default FunctionInput;

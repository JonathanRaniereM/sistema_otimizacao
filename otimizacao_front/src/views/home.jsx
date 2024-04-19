import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';


function FunctionInput() {
  const [functionText, setFunctionText] = useState('');
 
  const [bounds, setBounds] = useState('');
  const [maxIter, setMaxIter] = useState('');
  const [Function3D, setPlotsDataFunction3D] = useState(null); // Mantenha null aqui para controle de fluxo
  const [PointOptimal, setPlotsDataPointOptimal] = useState(null); 
  const [FeasibilityRegion, setPlotsDataFeasibilityRegion] = useState(null); 
  const [GradientTrajectory, setPlotsDataGradientTrajectory] = useState(null); 
  const [RandomTrajectory, setPlotsDataRandomTrajectory] = useState(null); 
  const [ConvergenceCurve, setPlotsDataConvergenceCurve] = useState(null); 
  const [ws, setWs] = useState(null);

  useEffect(() => {
    const newWs = new WebSocket('ws://10.100.0.23:8000/ws/manage_otimize/');

    newWs.onopen = () => {
      console.log('WebSocket Connected');
      setWs(newWs);
    };

    newWs.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'perform_optimization' && message.result) {
        console.log("MENSAGEM RECEBIDA", message);
        try {
          const resultData = JSON.parse(message.result);
          if (resultData.function_3d && resultData.function_3d.x && resultData.function_3d.y && resultData.function_3d.z) {
            setPlotsDataFunction3D(resultData.function_3d);
          
            setPlotsDataConvergenceCurve(resultData.convergence_curve);
            setPlotsDataFeasibilityRegion(resultData.feasibility_region);
            setPlotsDataRandomTrajectory(resultData.random_trajectory);
            setPlotsDataGradientTrajectory(resultData.gradient_trajectory);
            setPlotsDataPointOptimal(resultData.optimization.optimal_point)

            console.log("TRAJETORIA RANDOM",resultData.random_trajectory)
            console.log("TRAJETORIA GRADIENT",resultData.gradient_trajectory)
       
          } else {
            console.error('Dados de plotagem incompletos:', resultData);
          }
        } catch (err) {
          console.error('Falha ao parsear o resultado:', err);
        }
      }
    };
    

    return () => {
      newWs.close();
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected.');
      return;
    }

    try {
      const parsedBounds = JSON.parse(bounds);
      const message = {
        type: "perform_optimization",
        method: 'random',
        action: "optimize",
        data: {
          objective_function_str: functionText,
          bounds: parsedBounds,
          max_iter: parseInt(maxIter, 10),
          tolerance: 1e-6,
        },
        result: null,
        optimization_id: 1,
      };

      ws.send(JSON.stringify(message));
      console.log("Sent message:", message);

    } catch (error) {
      console.error('Error parsing input data:', error);
    }
  };

  const plotLayout = {
    margin: { t: 30 },
    plot_bgcolor: "rgba(0,0,0,0)",
    paper_bgcolor: "rgba(0,0,0,0)",
  };

  const plotLayoutConvergence = {
    title: {
      text: 'Curva de Convergência',
      font: {
        family: 'Arial, sans-serif',
        size: 20,
        color: 'black'
      },
      xref: 'paper',
      x: 0.5, // centraliza o título
    },
    margin: { t: 60, r: 30, b: 30, l: 30 }, // Ajusta a margem para acomodar o título e a legenda
    plot_bgcolor: "rgba(255,255,255,0.9)",
    paper_bgcolor: "transparent",
    hovermode: 'closest',
    xaxis: {
      title: "Iteração",
      showgrid: true,
      zeroline: true,
      gridcolor: 'lightgrey'
    },
    yaxis: {
      title: "Valor da Função",
      showline: false,
      gridcolor: 'lightgrey'
    },
    legend: {
      orientation: "h",
      x: 1,
      xanchor: 'right',
      y: 1.05, // Posiciona a legenda acima do gráfico
      font: {
        family: 'Arial, sans-serif',
        size: 14,
        color: '#333',
   
      }
    }
  };
  

  const plotLayoutSolutionTrajectory = {
    title: 'Trajetória da Solução',
    margin: { t: 50, r: 20, b: 40, l: 60 }, // Margens ajustadas
    plot_bgcolor: "rgba(255,255,255,1)", // Fundo branco
    paper_bgcolor: "rgba(255,255,255,1)",
    hovermode: 'closest',

    showlegend: true, // Mostra a legenda
    legend: {
      orientation: "h",
      x: 0.5,
      xanchor: 'center',
      y: -0.3, // Posição acima do gráfico
      yanchor: 'top',
      font: {
        family: 'Arial, sans-serif',
        size: 12,
        color: '#333'
      },
      bgcolor: 'rgba(255,255,255,0.5)', // Fundo semi-transparente para legibilidade
      bordercolor: 'Black',
      borderwidth: 1
    }
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
      {Function3D && Function3D.x && Function3D.y && Function3D.z && ( // Verificação adicional para garantir que todas as propriedades estão disponíveis
        <div className="plot-area">
      <Plot
        data={[{
          x: Function3D.x,
          y: Function3D.y,
          z: Function3D.z,
          type: 'surface',
          colorscale: 'Viridis'
        }]}
        layout={{ ...plotLayout, title: '3D Function Surface' }}
      />
      {/* Gráfico da função objetivo em 2D (Curvas de Nível) */}
    <Plot
      data={[{
        x: Function3D.x, // Utiliza os mesmos eixos x e y do gráfico 3D
        y: Function3D.y,
        z: Function3D.z, // Os valores de z devem ser uma matriz 2D de valores da função objetivo
        type: 'heatmap',
        colorscale: 'Jet',
        showscale: true // Mostra a barra de cores
      }]}
      layout={{ ...plotLayout, title: 'Curvas de Nível da Função Objetivo em 2D' }}
    />
<div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-around', marginTop: '20px' }}>

{GradientTrajectory && RandomTrajectory && PointOptimal && (
  <Plot
    data={[
      // Curvas de nível como plano de fundo
      {
        x: Function3D.x,
        y: Function3D.y,
        z: Function3D.z,
        type: 'contour',
        colorscale: 'Greys',
        showscale: false,
        contours: {
          coloring: 'lines',
        },
      },
      // Trajetória do método gradiente
      {
        x: GradientTrajectory.x,
        y: GradientTrajectory.y,
        mode: 'lines+markers',
        type: 'scatter',
        name: `Gradiente - Final: (${GradientTrajectory.x.slice(-1)[0]}, ${GradientTrajectory.y.slice(-1)[0]})`,
        line: { color: 'blue' },
        marker: { size: 7 }
      },
      // Trajetória do método aleatório
      {
        x: RandomTrajectory.x,
        y: RandomTrajectory.y,
        mode: 'lines+markers',
        type: 'scatter',
        name: `Aleatório - Final: (${RandomTrajectory.x.slice(-1)[0]}, ${RandomTrajectory.y.slice(-1)[0]})`,
        line: { color: 'red' },
        marker: { size: 7 }
      },
      // Ponto ótimo
      {
        x: [PointOptimal.x],
        y: [PointOptimal.y],
        mode: 'markers',
        type: 'scatter',
        name: `Ótimo - (${PointOptimal.x.toFixed(2)}, ${PointOptimal.y.toFixed(2)}) Valor: ${PointOptimal.value}`,
        marker: {
          color: 'green',
          size: 10,
          symbol: 'star'
        }
      }
    ]}
    layout={{
      ...plotLayoutSolutionTrajectory,
      annotations: [
        {
          x: PointOptimal.x,
          y: PointOptimal.y,
          text: 'Ponto ótimo',
          showarrow: true,
          arrowhead: 2,
          ax: 0,
          ay: -30
        }
      ]
    }}
  />
)}


{ConvergenceCurve && (
  <Plot
    data={ConvergenceCurve.map(curve => ({
      x: curve.iter,
      y: curve.values,
      type: 'scatter',
      mode: 'lines+markers',
      name: curve.type === 'random' ? 'Random' : 'Gradient',
      line: {
        color: curve.type === 'random' ? 'red' : 'blue',
        width: 2,
      },
      marker: {
        size: 6,
      },
    }))}
    layout={plotLayoutConvergence}
    config={{
      responsive: true,
      displayModeBar: true,
    }}
  />
)}



        <Plot
          data={[{
            z: FeasibilityRegion,
            x: Function3D.x,
            y: Function3D.y,
            type: 'heatmap',
            colorscale: [['0', 'white'], ['1', 'blue']], // Custom colorscale
            showscale: false // Hide color scale
          }]}
          layout={{ ...plotLayout, title: 'Feasibility Region' }}
        />
      </div>
    </div>
  )}
    </div>
  );
}

export default FunctionInput;


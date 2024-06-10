import React, { useState, useEffect } from 'react'
import LogoImage from './assets/images/LOGO OPTI (2).svg'
import { faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import Grid from '@mui/joy/Grid'
import './assets/styles/home.css'
import AutoSizer from 'react-virtualized-auto-sizer'

import Plot from 'react-plotly.js'

function FunctionInput() {
  const [functionText, setFunctionText] = useState('x^2 + 3*x + 2')
  const [bounds, setBounds] = useState('[[-10, 10], [-10, 10]]')
  const [maxIter, setMaxIter] = useState('5')
  const [Function3D, setPlotsDataFunction3D] = useState(null) // Mantenha null aqui para controle de fluxo
  const [PointOptimal, setPlotsDataPointOptimal] = useState(null)
  const [FeasibilityRegion, setPlotsDataFeasibilityRegion] = useState(null)
  const [GradientTrajectory, setPlotsDataGradientTrajectory] = useState(null)
  const [RandomTrajectory, setPlotsDataRandomTrajectory] = useState(null)
  const [ConvergenceCurve, setPlotsDataConvergenceCurve] = useState(null)
  const [feasibilityData, setFeasibilityData] = useState(null);
  const [toggleActive, setToggleActive] = useState(false)
  const [ws, setWs] = useState(null)
  const [isMenuVisible, setIsMenuVisible] = useState(false)

  useEffect(() => {
    const newWs = new WebSocket('ws://10.100.0.23:8000/ws/manage_otimize/')

    newWs.onopen = () => {
      console.log('WebSocket Connected')
      setWs(newWs)
    }

    newWs.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'perform_optimization' && message.result) {
        console.log("MENSAGEM RECEBIDA", message);
        try {
          const resultData = JSON.parse(message.result);
          if (resultData.function_3d && resultData.function_3d.x && resultData.function_3d.y && resultData.function_3d.z) {
            // Extrair X, Y, Z da resposta
            const X = resultData.function_3d.x;
            const Y = resultData.function_3d.y;
            const Z = resultData.function_3d.z;
  
            
            const newFeasibilityData = Z.map((row, rowIndex) =>
              row.map((value, colIndex) => {
                const x = X[rowIndex];
                const y = Y[colIndex];
                // Verifica se todas as restrições são satisfeitas
                const isWithinBounds =
                  x + y <= 10 &&
                  2 * x + y <= 20 &&
                  x >= 0 &&
                  y >= 0;
                return isWithinBounds ? 1 : 0;
              })
            );
  
            // Atualiza o estado com os dados extraídos
            setFeasibilityData({
              x: X,
              y: Y,
              z: newFeasibilityData,
            });
  
            setPlotsDataFunction3D(resultData.function_3d);
            setPlotsDataConvergenceCurve(resultData.convergence_curve);
            setPlotsDataFeasibilityRegion(resultData.feasibility_region);
            setPlotsDataRandomTrajectory(resultData.random_trajectory);
            setPlotsDataGradientTrajectory(resultData.gradient_trajectory);
            setPlotsDataPointOptimal(resultData.optimization.optimal_point);
  
            console.log("TRAJETORIA RANDOM", resultData.random_trajectory);
            console.log("TRAJETORIA GRADIENT", resultData.gradient_trajectory);
  
          } else {
            console.error('Dados de plotagem incompletos:', resultData);
          }
        } catch (err) {
          console.error('Falha ao parsear o resultado:', err);
        }
      } else if (message.type === 'perform_optimization_all' && message.result) {
        console.log('COORDENADAS RECEBIDAS', message);
        const resultData = JSON.parse(message.result);

        // Extrair X, Y, Z da resposta
        const X = resultData.function_3d.x;
        const Y = resultData.function_3d.y;
        const Z = resultData.function_3d.z;

        
        const newFeasibilityData = Z.map((row, rowIndex) =>
          row.map((value, colIndex) => {
            const x = X[rowIndex];
            const y = Y[colIndex];
            // Verifica se todas as restrições são satisfeitas
            const isWithinBounds =
              x + y <= 10 &&
              2 * x + y <= 20 &&
              x >= 0 &&
              y >= 0;
            return isWithinBounds ? 1 : 0;
          })
        );
        // Atualiza o estado com os dados extraídos
        setFeasibilityData({
          x: X,
          y: Y,
          z: newFeasibilityData,
        });
        try {
          const resultData = JSON.parse(message.result);
          if (resultData.function_3d && resultData.function_3d.x && resultData.function_3d.y && resultData.function_3d.z) {
            setPlotsDataFunction3D(resultData.function_3d);
            setPlotsDataConvergenceCurve(resultData.convergence_curve);
            setPlotsDataFeasibilityRegion(resultData.feasibility_region);
            setPlotsDataRandomTrajectory(resultData.random_trajectory);
            setPlotsDataGradientTrajectory(resultData.gradient_trajectory);
            setPlotsDataPointOptimal(resultData.optimization.optimal_point);
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
    e.preventDefault()
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected.')
      return
    }

    try {
      const parsedBounds = JSON.parse(bounds)
      const message = {
        type: toggleActive ? 'perform_optimization_all' : 'perform_optimization',
        method: 'random',
        action: toggleActive ? 'optimize_all' : 'optimize',
        data: {
          objective_function_str: functionText,
          bounds: parsedBounds,
          max_iter: parseInt(maxIter, 10),
          tolerance: 1e-6
        },
        result: null,
        optimization_id: 1
      }

      ws.send(JSON.stringify(message))
      console.log('Sent message:', message)
    } catch (error) {
      console.error('Error parsing input data:', error)
    }
  }

  const plotLayoutObjetive3D = {
    title: {
      text: 'Função Objetivo 3D',
      font: {
        family: 'Arial, sans-serif',
        size: 20,
        color: 'white'
      },
      xref: 'paper',
      x: 0.5 // centraliza o título
    },
    autosize: true,
    width: '100%',
    height: '100%',
    margin: { t: 30, r: 30, b: 40, l: 30 },
    plot_bgcolor: 'rgba(0,0,0,0)',
    paper_bgcolor: 'rgba(0,0,0,0)',
    scene: {
      xaxis: {
        title: 'X Axis',
        titlefont: { color: '#ffffff' },
        tickfont: { color: '#ffffff' },
        gridcolor: '#ffffff',
        zerolinecolor: '#ffffff',
        linecolor: '#ffffff'
      },
      yaxis: {
        title: 'Y Axis',
        titlefont: { color: '#ffffff' },
        tickfont: { color: '#ffffff' },
        gridcolor: '#ffffff',
        zerolinecolor: '#ffffff',
        linecolor: '#ffffff'
      },
      zaxis: {
        title: 'Z Axis',
        titlefont: { color: '#ffffff' },
        tickfont: { color: '#ffffff' },
        gridcolor: '#ffffff',
        zerolinecolor: '#ffffff',
        linecolor: '#ffffff'
      }
    }
  };
  
  const gradienteCustomizado = [
    [0, 'rgba(255,255,255,1)'],    // Branco
    [0.17, 'rgba(215,242,236,1)'],    // Branco azulado muito suave
    [0.33, 'rgba(175,228,217,1)'],    // Azul esverdeado claro
    [0.37, 'rgba(165,225,212,1)'],    // Azul esverdeado um pouco mais escuro
    [0.42, 'rgba(152,221,206,1)'],    // Suavização para o próximo
    [0.44, 'rgba(147,219,204,1)'],    // Leve ajuste para mais escuro
    [0.57, 'rgba(114,208,188,1)'],    // Azul esverdeado médio
    [0.74, 'rgba(71,193,167,1)'],     // Azul esverdeado mais escuro
    [0.85, 'rgba(6,171,136,1)'],      // Verde azulado forte
    [0.93, 'rgba(6,171,136,1)'],      // Mantendo a cor
    [0.99, 'rgba(6,171,136,1)'],      // Continuidade até o final
    [1, 'rgba(6,171,136,1)']       // Verde azulado forte no final
  ];
  
  
  const plotLayoutCountorsLevels = {
    title: {
      text: 'Curvas de Nível da Função Objetivo 2D',
      font: {
        family: 'Arial, sans-serif',
        size: 20,
        color: 'white'
      },
      xref: 'paper',
      x: 0.5 // centraliza o título
    },
    width: 400,
    height: 370,
    margin: { t: 60, r: 20, b: 40, l: 60 },
    plot_bgcolor: 'transparent',
    paper_bgcolor: 'transparent',
    xaxis: { 
      title: 'X Axis',
      titlefont: { color: '#ffffff' },
      tickfont: { color: '#ffffff' },
      gridcolor: '#ffffff',
      zerolinecolor: '#ffffff',
      linecolor: '#ffffff',
      color: 'white'
    },
    yaxis: { 
      title: 'Y Axis',
      titlefont: { color: '#ffffff' },
      tickfont: { color: '#ffffff' },
      gridcolor: '#ffffff',
      zerolinecolor: '#ffffff',
      linecolor: '#ffffff',
      color: 'white'
    },
    hovermode: 'closest',
    colorscale: [
      [0, '#157aab'],
      [0.5, '#80bfe5'],
      [1, '#d0e9f8']
    ]
  };
  
  const dataContours = {
    type: 'contour',
    z: [[10, 10.625, 12.5, 15.625, 20], [5.625, 6.25, 8.125, 11.25, 15.625], [2.5, 3.125, 5, 8.125, 12.5], [0.625, 1.25, 3.125, 6.25, 10.625], [0, 0.625, 2.5, 5.625, 10]],
    colorscale: gradienteCustomizado,
    autocontour: true,
    contours: {
      coloring: 'heatmap'
    }
  };
  
  const plotLayout = {
    title: {
      text: 'Região de Viabilidade',
      font: {
        family: 'Arial, sans-serif',
        size: 20,
        color: 'white'
      },
      xref: 'paper',
      x: 0.5 // centraliza o título
    },
    width: 400,
    height: 250,
    margin: { t: 30 },
    plot_bgcolor: 'transparent',
    paper_bgcolor: 'transparent',
    xaxis: { 
      title: 'X Axis',
      titlefont: { color: '#ffffff' },
      tickfont: { color: '#ffffff' },
      gridcolor: '#ffffff',
      zerolinecolor: '#ffffff',
      linecolor: '#ffffff',
      color: 'white'
    },
    yaxis: { 
      title: 'Y Axis',
      titlefont: { color: '#ffffff' },
      tickfont: { color: '#ffffff' },
      gridcolor: '#ffffff',
      zerolinecolor: '#ffffff',
      linecolor: '#ffffff',
      color: 'white'
    },
    hovermode: 'closest'
  };
  
  const plotLayoutConvergence = {
    width: 400,
    height: 240,
    title: {
      text: 'Curva de Convergência',
      font: { family: 'Arial, sans-serif', size: 20, color: 'white' },
      xref: 'paper',
      x: 0.5
    },
    margin: { t: 30, r: 30, b: 30, l: 30 },
    plot_bgcolor: 'transparent',
    paper_bgcolor: 'transparent',
    hovermode: 'closest',

    legend: {
      orientation: 'h',
      x: 1,
      xanchor: 'right',
      y: 1.05,
      font: { family: 'Arial, sans-serif', size: 14, color: 'white' }
    }
  };
  
  const plotLayoutSolutionTrajectory = {
    title: {
      text: 'Trajétoria da Solução',
      font: {
        family: 'Arial, sans-serif',
        size: 20,
        color: 'white'
      },
      xref: 'paper',
      x: 0.5 // centraliza o título
    },
    autosize: true,
    width: '100%',
    height: 450,
    margin: { t: 50, r: 20, b: 40, l: 60 },
    plot_bgcolor: 'transparent',
    paper_bgcolor: 'transparent',
    hovermode: 'closest',
   
    
    legend: {
      orientation: 'h',
      x: 0.5,
      xanchor: 'center',
      y: -0.3,
      yanchor: 'top',
      font: { family: 'Arial, sans-serif', size: 12, color: 'white' },
      bgcolor: 'rgba(255,255,255,0.5)',
      bordercolor: 'white',
      borderwidth: 1
    }
  };
  

  function toggleMenu() {
    setIsMenuVisible(!isMenuVisible)
  }

  function submitForm(event) {
    handleSubmit(event)
  }

  function shareSampling(event) {
    setToggleActive(!toggleActive)
    handleSubmit(event)
  }

  return (
    <div className="tela_home">
      <div className="header-home">
        <div className="logo-container-home">
          <img src={LogoImage} alt="Logo" style={{ width: '100px', height: '100px', marginLeft: '10%' }} />
        </div>

        <div className="form-container">
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

            <div className="menu-icon-container">
              <FontAwesomeIcon
                icon={isMenuVisible ? faChevronUp : faChevronDown}
                onClick={toggleMenu}
                style={{ cursor: 'pointer', position: 'relative',color: 'white' }}
              />
              <div id="context-menu" className="context-menu" style={{ display: isMenuVisible ? 'block' : 'none' }}>
                <button type="submit" onClick={submitForm}>
                  Enviar Dados
                </button>
                <button type="submit" onClick={shareSampling}>
                  Compartilhar Amostragem
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <div className="content-home">
        <Grid container spacing={8} sx={{ flexGrow: 1 }}>
          <Grid sm={12} md={8}>
            {Function3D && (
              <div className="card_secondary card_obtjetive_3d">
              <AutoSizer style={{ height: 600 }}>
                {({ width, height }) => (
                  <Plot
                    data={[
                      {
                        x: Function3D.x,
                        y: Function3D.y,
                        z: Function3D.z,
                        type: 'surface',
                        colorscale: gradienteCustomizado,
                        colorbar: {
                          title: ' ', // Título da colorbar
                          titleside: 'right',
                          titlefont: {
                            size: 12,
                            color: 'white'
                          },
                          tickfont: {
                            size: 10,
                            color: 'white'
                          }
                        }
                      }
                    ]}
                    layout={{ ...plotLayoutObjetive3D, width, height }}
                    useResizeHandler
                    config={{
                      autosizable: true,
                      responsive: true,
                      displayModeBar: false
                    }}
                  />
                )}
              </AutoSizer>
              </div>
            )}
          </Grid>
          <Grid sm={12} md={4}>
            {GradientTrajectory && RandomTrajectory && PointOptimal && (
              <div className="card card_solution_trajectory">
                <AutoSizer style={{ height: 400 }}>
                  {({ width }) => (
                    <Plot
                      data={[
                        // Curvas de nível como plano de fundo
                        {
                          x: Function3D.x,
                          y: Function3D.y,
                          z: Function3D.z,
                          type: 'contour',
                          colorscale: [[0, 'white'], [1, 'white']], // Escala transparente para o preenchimento
                        contours: {
                          coloring: 'lines', // Mostra apenas as linhas
                          showlabels: false, // Opcional: desativa os labels nas linhas de contorno
                          labelfont: {
                            // Opcional: configura a fonte dos labels, se você escolher mostrar
                            size: 12,
                            color: 'white',
                          },
                          line: {
                            color: 'white', // Define a cor das linhas para branco
                            width: 6,
                            height:10 // Aumenta a espessura das linhas para 2 pixels
                          }
                        },
                        },
                        // Trajetória do método gradiente
                        {
                          x: GradientTrajectory.x,
                          y: GradientTrajectory.y,
                          mode: 'lines+markers',
                          type: 'scatter',
                          name: `Gradiente - Final: (${GradientTrajectory.x.slice(-1)[0]}, ${
                            GradientTrajectory.y.slice(-1)[0]
                          })`,
                          line: { color: 'red' },
                          marker: { size: 7 }
                        },
                        // Trajetória do método aleatório
                        {
                          x: RandomTrajectory.x,
                          y: RandomTrajectory.y,
                          mode: 'lines+markers',
                          type: 'scatter',
                          name: `Aleatório - Final: (${RandomTrajectory.x.slice(-1)[0]}, ${
                            RandomTrajectory.y.slice(-1)[0]
                          })`,
                          line: { color: '#1c1833' },
                          marker: { size: 7 }
                        },
                        // Ponto ótimo
                        {
                          x: [PointOptimal.x],
                          y: [PointOptimal.y],
                          mode: 'markers',
                          type: 'scatter',
                          name: `Ótimo - (${PointOptimal.x.toFixed(2)}, ${PointOptimal.y.toFixed(2)}) Valor: ${
                            PointOptimal.value
                          }`,
                          marker: {
                            color: '#f9fa10',
                            size: 10,
                            symbol: 'star'
                          }
                        }
                      ]}
                      useResizeHandler
                      layout={{
                        ...plotLayoutSolutionTrajectory,
                        width,
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
                      config={{
                        autosizable: true,
                        responsive: true,
                        displayModeBar: false
                      }}
                    />
                  )}
                </AutoSizer>
              </div>
            )}
          </Grid>
          
          <Grid sm={12} md={4}>
            {ConvergenceCurve && (
              <div className="card card_convergence_curve">
                <AutoSizer style={{ height: 250 }}>
                  {({ width }) => (
                    <Plot
                      data={ConvergenceCurve.map((curve) => ({
                        x: curve.iter,
                        y: curve.values,
                        type: 'scatter',
                        mode: 'lines+markers',
                        name: curve.type === 'random' ? 'Random' : 'Gradient',
                        line: {
                          color: curve.type === 'random' ? '#1c1833' : 'red',
                          width: 2
                        },
                        marker: {
                          size: 6
                        }
                      }))}
                      useResizeHandler
                      layout={{ autosize: true, ...plotLayoutConvergence, width }}
                      config={{
                        autosizable: true,
                        responsive: true,
                        displayModeBar: false
                      }}
                    />
                  )}
                </AutoSizer>
              </div>
            )}

          </Grid>
          <Grid sm={12} md={4}>
            {FeasibilityRegion && (
              <div className="card card_feasibility_region">
                <AutoSizer style={{ height: 250 }}>
                  {({ width }) => (
                    <Plot
                    data={[
                      {
                        z: Function3D.z,
                        x: Function3D.x,
                        y: Function3D.y,
                        type: 'contour',
                        colorscale: [[0, 'white'], [1, 'white']], // Escala transparente para o preenchimento
                        contours: {
                          coloring: 'lines', // Mostra apenas as linhas
                          showlabels: false, // Opcional: desativa os labels nas linhas de contorno
                          labelfont: {
                            // Opcional: configura a fonte dos labels, se você escolher mostrar
                            size: 12,
                            color: 'white',
                          },
                          line: {
                            color: 'white', // Define a cor das linhas para branco
                            width: 6,
                            height:10 // Aumenta a espessura das linhas para 2 pixels
                          }
                        },
                      },
                      {
                        z: feasibilityData.z,
                        x: feasibilityData.x,
                        y: feasibilityData.y,
                        type: 'heatmap',
                        colorscale: [
                          ['0', 'transparent'],
                          ['1', '#47c1a7']
                        ],
                        showscale: true // Esconde a barra de cores
                      }
                    ]}

                      useResizeHandler
                      layout={{ autosize: true, ...plotLayout, width}}
                      config={{
                        autosizable: true,
                        responsive: true,
                        displayModeBar: false
                      }}
                    />
                  )}
                </AutoSizer>
              </div>
            )}
          </Grid>
          <Grid sm={12} md={4}>
            {Function3D && (
              <div className="card card_countors_levels">
                <AutoSizer style={{ height: 250 }}>
                  {({ width }) => (
                    <Plot

                    data={[
                      {
                        z: Function3D.z,
                        x: Function3D.x,
                        y: Function3D.y,
                        type: 'contour',
                        colorscale: [[0, '#1c1833'], [1, '#1c1833']], // Escala transparente para o preenchimento
                        contours: {
                          coloring: 'lines', // Mostra apenas as linhas
                          showlabels: false, // Opcional: desativa os labels nas linhas de contorno
                          labelfont: {
                            // Opcional: configura a fonte dos labels, se você escolher mostrar
                            size: 12,
                            color: 'white',
                          },
                          line: {
                            color: 'white', // Define a cor das linhas para branco
                            width: 6,
                            height:10 // Aumenta a espessura das linhas para 2 pixels
                          }
                        },
                        colorbar: {
                         
                          titleside: 'right',
                          titlefont: {
                            size: 12,
                            color: 'transparent'
                          },
                          tickfont: {
                            size: 10,
                            color: 'transparent'
                          }
                        }
                        
                      },
                      {
                        x: Function3D.x, // Utiliza os mesmos eixos x e y do gráfico 3D
                        y: Function3D.y,
                        z: Function3D.z, // Os valores de z devem ser uma matriz 2D de valores da função objetivo
                        type: 'heatmap',
                        colorscale:gradienteCustomizado,
                        showscale: true, // Esconde a barra de cores
                        colorbar: {
                          title: 'Intensidade', // Título da colorbar
                          titleside: 'right',
                          titlefont: {
                            size: 12,
                            color: 'white'
                          },
                          tickfont: {
                            size: 10,
                            color: 'white'
                          }
                        }
                      }
                    ]}
                    
                    
                      useResizeHandler
                      layout={{
                        autosize: true,
                        ...plotLayoutCountorsLevels,
                        width
                      }}
                      config={{
                        autosizable: true,
                        responsive: true,
                        displayModeBar: false
                      }}
                    />
                  )}
                </AutoSizer>
              </div>
            )}
          </Grid>
        </Grid>
      </div>
    </div>
  )
}

export default FunctionInput

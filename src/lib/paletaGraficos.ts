// Paleta categórica de los gráficos de Reportes estadísticos (pantalla y PDF).
// Cada color tiene un tono distinto para que los segmentos se distingan de un
// vistazo; todos son lo bastante oscuros para el texto blanco de los aros y lo
// bastante claros para leerse sobre fondo blanco. El orden alterna tonos
// lejanos para que dos segmentos vecinos nunca se parezcan.
export const PALETA_GRAFICOS = [
  '#073763', // azul institucional
  '#c23b3b', // rojo
  '#23885a', // verde
  '#d9670f', // naranja
  '#7a4fc0', // morado
  '#12879a', // turquesa
  '#a87b00', // mostaza
  '#c2457f', // fucsia
]

export function colorGrafico(indice: number): string {
  return PALETA_GRAFICOS[indice % PALETA_GRAFICOS.length]
}

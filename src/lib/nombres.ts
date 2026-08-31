// Divide un nombre completo (como el que devuelve la API de Hacienda o el
// que la persona escribe a mano) en nombre + apellido1 + apellido2, siguiendo
// la convención costarricense: las últimas dos palabras son los apellidos y
// todo lo anterior es el nombre. No es infalible (apellidos compuestos como
// "DE LA CRUZ", o personas con un solo apellido registrado), pero es la
// misma convención que usan los sistemas de Hacienda/TSE, y los campos
// quedan editables después por si hay que corregir un caso puntual.
export interface NombrePartido {
  nombre: string
  apellido1: string
  apellido2: string
}

export function partirNombreCompleto(nombreCompleto: string): NombrePartido {
  const palabras = nombreCompleto.trim().split(/\s+/).filter(Boolean)

  if (palabras.length === 0) return { nombre: '', apellido1: '', apellido2: '' }
  if (palabras.length === 1) return { nombre: palabras[0], apellido1: '', apellido2: '' }
  if (palabras.length === 2) return { nombre: palabras[0], apellido1: palabras[1], apellido2: '' }
  if (palabras.length === 3) {
    return { nombre: palabras[0], apellido1: palabras[1], apellido2: palabras[2] }
  }

  // 4+ palabras: las últimas dos son apellido1/apellido2, el resto es el nombre.
  const copia = [...palabras]
  const apellido2 = copia.pop() as string
  const apellido1 = copia.pop() as string
  const nombre = copia.join(' ')
  return { nombre, apellido1, apellido2 }
}

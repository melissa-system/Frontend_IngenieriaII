import { useState } from 'react'
import Alerta from '../../components/ui/Alerta'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Cargando from '../../components/ui/Cargando'
import EmptyState from '../../components/ui/EmptyState'
import ErrorState from '../../components/ui/ErrorState'
import { Archivo, Fecha, Input, Select, Textarea } from '../../components/ui/campos'
import Modal, { ModalConfirmar, ModalFormulario } from '../../components/ui/Modal'
import PageHeader from '../../components/ui/PageHeader'
import Paginador from '../../components/ui/Paginador'
import Table, { Td } from '../../components/ui/Table'
import { useToast } from '../../components/ui/ToastProvider'
import { ordenar, paginar, siguienteOrden, type OrdenTabla } from '../../lib/tabla'

// Página de demostración de la biblioteca de componentes (solo en desarrollo:
// /dashboard/componentes). Sirve para revisar de un vistazo estados, tamaños y
// responsividad de cada componente contra la guía de estilos.
const FILAS = Array.from({ length: 27 }, (_, i) => ({
  id: i + 1,
  nombre: ['Ana', 'Beto', 'Carla', 'Dani', 'Eli', 'Fabio'][i % 6] + ` ${i + 1}`,
  estado: i % 3 === 0 ? 'Pendiente' : i % 3 === 1 ? 'Aprobada' : 'Rechazada',
}))

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-tarjeta border border-primary-100 bg-white p-4 shadow-tarjeta sm:p-6">
      <h2 className="text-subtitulo font-semibold text-primary-900">{titulo}</h2>
      {children}
    </section>
  )
}

function Componentes() {
  const { notificar } = useToast()
  const [modal, setModal] = useState<'confirmar' | 'formulario' | 'simple' | null>(null)
  const [orden, setOrden] = useState<OrdenTabla | null>(null)
  const [pagina, setPagina] = useState(1)
  const ordenadas = ordenar(FILAS, orden, { nombre: (f) => f.nombre, estado: (f) => f.estado })
  const p = paginar(ordenadas, pagina, 5)

  return (
    <div className="space-y-6">
      <PageHeader titulo="Biblioteca de componentes" descripcion="Referencia viva de src/components/ui (solo desarrollo)." />

      <Seccion titulo="Botones">
        <div className="flex flex-wrap gap-3">
          <Button>Primario</Button>
          <Button variant="secondary">Secundario</Button>
          <Button variant="danger">Peligro</Button>
          <Button variant="success">Éxito</Button>
          <Button variant="info">Info</Button>
          <Button variant="ghost">Suave</Button>
          <Button disabled>Deshabilitado</Button>
          <Button loading>Guardando</Button>
          <Button size="sm">Pequeño</Button>
        </div>
      </Seccion>

      <Seccion titulo="Campos de formulario">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Texto" obligatorio placeholder="Nombre completo" ayuda="Como aparece en la cédula" />
          <Input label="Con error" obligatorio defaultValue="abc" error="Este campo no es válido." />
          <Select label="Selector" defaultValue="">
            <option value="">Seleccione…</option>
            <option>Opción A</option>
          </Select>
          <Fecha label="Fecha" />
          <Archivo label="Archivo" ayuda="PDF, JPG o PNG hasta 5 MB" />
          <Input label="Deshabilitado" disabled defaultValue="No editable" />
        </div>
        <Textarea label="Observaciones" rows={3} />
      </Seccion>

      <Seccion titulo="Tabla con ordenamiento y paginación">
        <Table
          cabecera={[{ etiqueta: 'Nombre', clave: 'nombre' }, { etiqueta: 'Estado', clave: 'estado' }]}
          orden={orden}
          onOrdenar={(c) => {
            setOrden(siguienteOrden(orden, c))
            setPagina(1)
          }}
          pie={<Paginador total={FILAS.length} pagina={p.pagina} porPagina={5} onCambiar={setPagina} etiqueta="registros" />}
        >
          {p.filas.map((f) => (
            <tr key={f.id}>
              <Td>{f.nombre}</Td>
              <Td>
                <Badge color={f.estado === 'Aprobada' ? 'green' : f.estado === 'Rechazada' ? 'red' : 'yellow'}>{f.estado}</Badge>
              </Td>
            </tr>
          ))}
        </Table>
      </Seccion>

      <Seccion titulo="Modales">
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setModal('simple')}>Modal simple</Button>
          <Button variant="danger" onClick={() => setModal('confirmar')}>Modal de confirmación</Button>
          <Button variant="secondary" onClick={() => setModal('formulario')}>Modal de formulario</Button>
        </div>
      </Seccion>

      <Seccion titulo="Alertas y toasts">
        <div className="space-y-2">
          <Alerta tipo="exito">Los cambios se guardaron.</Alerta>
          <Alerta tipo="error">No se pudo guardar. Intentá de nuevo.</Alerta>
          <Alerta tipo="advertencia">El stock está por debajo del mínimo.</Alerta>
          <Alerta tipo="info">Tu solicitud está en revisión.</Alerta>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="success" onClick={() => notificar('Guardado correctamente.', 'exito')}>Toast éxito</Button>
          <Button variant="danger" onClick={() => notificar('Ocurrió un error.', 'error')}>Toast error</Button>
          <Button variant="secondary" onClick={() => notificar('Revisá los datos.', 'advertencia')}>Toast advertencia</Button>
          <Button variant="info" onClick={() => notificar('Solicitud en revisión.', 'info')}>Toast info</Button>
        </div>
      </Seccion>

      <Seccion titulo="Estados de interfaz">
        <Cargando compacto />
        <EmptyState titulo="No hay registros" descripcion="Cuando haya datos aparecerán aquí." />
        <ErrorState mensaje="No se pudo cargar la información." onReintentar={() => notificar('Reintentando…', 'info')} />
      </Seccion>

      {modal === 'simple' && (
        <Modal size="md" label="Modal de ejemplo" onCerrar={() => setModal(null)}>
          <div className="space-y-4">
            <p className="text-sm text-primary-700">Contenido libre. Escape o Cerrar lo cierran; el foco queda atrapado aquí dentro.</p>
            <div className="flex justify-end">
              <Button onClick={() => setModal(null)}>Cerrar</Button>
            </div>
          </div>
        </Modal>
      )}
      {modal === 'confirmar' && (
        <ModalConfirmar
          titulo="¿Eliminar el registro?"
          mensaje="Esta acción no se puede deshacer."
          textoConfirmar="Eliminar"
          variante="danger"
          onConfirmar={() => {
            setModal(null)
            notificar('Registro eliminado.', 'exito')
          }}
          onCancelar={() => setModal(null)}
        />
      )}
      {modal === 'formulario' && (
        <ModalFormulario
          titulo="Nuevo registro"
          onSubmit={(e) => {
            e.preventDefault()
            setModal(null)
            notificar('Registro creado.', 'exito')
          }}
          onCancelar={() => setModal(null)}
        >
          <Input label="Nombre" obligatorio />
          <Fecha label="Fecha" />
        </ModalFormulario>
      )}
    </div>
  )
}

export default Componentes

import { useRef, useState, type ChangeEvent, type DragEvent } from 'react'

export const ACCEPT_DOCUMENTO = '.pdf,.jpg,.jpeg,.png'
export const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
export const MAX_MB = 5

const EXTENSIONES_VALIDAS = ['pdf', 'jpg', 'jpeg', 'png']

// Valida tamaño y extensión de un documento de respaldo (la misma regla para
// todas las solicitudes). Devuelve un mensaje de error o null si es válido.
export function validarDocumento(file: File): string | null {
  if (file.size > MAX_BYTES) {
    return `El archivo no puede superar los ${MAX_MB} MB.`
  }
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  if (!EXTENSIONES_VALIDAS.includes(ext)) {
    return `Formato inválido. Solo se admiten archivos .pdf, .jpg, .jpeg o .png.`
  }
  return null
}

// Selector de archivos con drag-and-drop, vista previa inmediata y botón para
// descartar el archivo. Es el mismo componente que usa "Cambio de Propietario"
// y se comparte en todas las solicitudes que requieren evidencia.
export function FileDropZone({
  archivo,
  archivoPreview,
  onFileSelect,
  onRemoveFile,
  errorArchivo,
  label,
  ayuda,
  obligatorio = true,
}: {
  archivo: File | null
  archivoPreview: string | null
  onFileSelect: (file: File) => void
  onRemoveFile: () => void
  errorArchivo?: string
  label: string
  ayuda?: string
  obligatorio?: boolean
}) {
  const [arrastrando, setArrastrando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setArrastrando(true)
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setArrastrando(false)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setArrastrando(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      onFileSelect(file)
    }
  }

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)
    }
  }

  const pesoEnMB = archivo ? (archivo.size / (1024 * 1024)).toFixed(2) : '0'

  return (
    <div>
      <label className="block text-sm font-medium text-primary-700">
        {label}
        {obligatorio ? ' *' : ''}
      </label>
      {ayuda && <p className="mt-0.5 text-xs text-primary-500">{ayuda}</p>}

      {!archivo ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
            arrastrando
              ? 'border-primary-500 bg-primary-50'
              : errorArchivo
              ? 'border-red-300 bg-red-50/50 hover:bg-red-50'
              : 'border-primary-200 bg-gray-50/50 hover:bg-primary-50/40'
          }`}
        >
          <svg
            className="h-10 w-10 text-primary-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="mt-2 text-sm font-medium text-primary-700">
            Arrastrá y soltá el archivo aquí o{' '}
            <span className="text-primary-600 underline">examiná tus archivos</span>
          </p>
          <p className="mt-1 text-xs text-gray-400">
            PDF, JPG o PNG hasta {MAX_MB} MB
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT_DOCUMENTO}
            onChange={handleInputChange}
            className="hidden"
          />
        </div>
      ) : (
        <div className="mt-2 flex items-center justify-between rounded-xl border border-primary-200 bg-primary-50/40 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            {archivoPreview ? (
              <img
                src={archivoPreview}
                alt="Vista previa"
                className="h-16 w-16 rounded-lg border border-primary-200 object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-primary-200 bg-white text-primary-700 shadow-sm">
                <svg
                  className="h-8 w-8 text-red-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9.5 8.5h-2v1h2v1.5h-2v1.5h3v1.5h-4.5V8h4.5v3.5zm4 5h-1.5V8h2.5c1.1 0 2 .9 2 2v3c0 1.1-.9 2-2 2h-1zm4-3.5h-2v2h-1.5V8H18c1.1 0 2 .9 2 2v1.5c0 1.1-.9 2-2 2z" />
                </svg>
              </div>
            )}
            <div>
              <p className="text-sm font-semibold text-primary-900 line-clamp-1">
                {archivo.name}
              </p>
              <p className="text-xs text-primary-500">{pesoEnMB} MB</p>
              <span className="mt-1 inline-flex items-center rounded bg-primary-100 px-2 py-0.5 text-[10px] font-medium text-primary-700">
                Listo para enviar
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onRemoveFile}
            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 shadow-sm transition hover:bg-red-50"
          >
            Descartar archivo
          </button>
        </div>
      )}

      {errorArchivo && (
        <p className="mt-1.5 text-xs font-medium text-red-600">{errorArchivo}</p>
      )}
    </div>
  )
}
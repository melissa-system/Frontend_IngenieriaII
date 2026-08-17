import { useState } from 'react'
import { MOCK_PUBLICACIONES, MOCK_DOCUMENTOS } from '../../lib/mockData'

type Tab = 'publicaciones' | 'documentos'

function Administrativo() {
  const [tab, setTab] = useState<Tab>('publicaciones')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-primary-900">
          Administrativo
        </h1>
        <p className="mt-1 text-sm text-primary-500">
          Gestión de publicaciones y documentos
        </p>
      </div>

      <div className="flex gap-2 border-b border-primary-100">
        <button
          type="button"
          onClick={() => setTab('publicaciones')}
          className={`px-4 py-3 text-sm font-medium transition-colors ${
            tab === 'publicaciones'
              ? 'border-b-2 border-primary-700 text-primary-700'
              : 'text-primary-500 hover:text-primary-700'
          }`}
        >
          Publicaciones
        </button>
        <button
          type="button"
          onClick={() => setTab('documentos')}
          className={`px-4 py-3 text-sm font-medium transition-colors ${
            tab === 'documentos'
              ? 'border-b-2 border-primary-700 text-primary-700'
              : 'text-primary-500 hover:text-primary-700'
          }`}
        >
          Documentos
        </button>
      </div>

      {tab === 'publicaciones' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              className="rounded-full bg-primary-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-800"
            >
              + Nueva publicación
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {MOCK_PUBLICACIONES.map((pub) => (
              <div key={pub.id} className="rounded-xl border border-primary-100 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-700">
                    {pub.tipo}
                  </span>
                  <span
                    className={`text-xs font-medium ${
                      pub.publicado ? 'text-green-600' : 'text-primary-400'
                    }`}
                  >
                    {pub.publicado ? 'Publicado' : 'Borrador'}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-semibold text-primary-900">
                  {pub.titulo}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm text-primary-600">
                  {pub.contenido}
                </p>
                <p className="mt-3 text-xs text-primary-400">{pub.fecha}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'documentos' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              className="rounded-full bg-primary-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-800"
            >
              + Subir documento
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-primary-100 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-primary-100 text-sm">
              <thead className="bg-primary-50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Título</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Tipo</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Fecha</th>
                  <th className="px-4 py-3 text-left font-medium text-primary-700">Archivo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-50">
                {MOCK_DOCUMENTOS.map((doc) => (
                  <tr key={doc.id} className="hover:bg-primary-50/50">
                    <td className="px-4 py-3 font-medium text-primary-900">{doc.titulo}</td>
                    <td className="px-4 py-3 text-primary-600">{doc.tipo}</td>
                    <td className="px-4 py-3 text-primary-500">{doc.fecha}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="text-sm font-medium text-primary-600 hover:text-primary-800 hover:underline"
                      >
                        📄 {doc.archivo}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default Administrativo

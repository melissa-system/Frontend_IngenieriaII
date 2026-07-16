import { Link } from 'react-router-dom'

function BreakdownsTeaser() {
  return (
    <section
      id="averias"
      className="scroll-mt-20 bg-white px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-5xl text-center">
        <p className="text-sm font-semibold tracking-widest text-primary-600 uppercase">
          Averías
        </p>
        <h2 className="mt-2 font-heading text-3xl font-semibold text-primary-900 sm:text-4xl">
          ¿Tienes un problema con el servicio?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-primary-800">
          Reporta fugas, tuberías rotas, falta de presión u otros problemas
          con el servicio de agua. Entre más pronto lo reportes, más rápido
          podemos atenderlo.
        </p>

        <Link
          to="/reportar-averia"
          className="mt-8 inline-block rounded-full bg-primary-700 px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-800"
        >
          Reportar avería
        </Link>
      </div>
    </section>
  )
}

export default BreakdownsTeaser

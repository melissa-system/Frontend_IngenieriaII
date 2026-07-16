import { Link } from 'react-router-dom'
import heroImg from '../../assets/hero.jpg'

function Hero() {
  return (
    <section
      id="inicio"
      className="relative flex min-h-[100svh] scroll-mt-20 items-end bg-cover bg-center text-white sm:min-h-[90vh] sm:items-center"
      style={{ backgroundImage: `url(${heroImg})` }}
    >
      {/* Sin overlay sobre la foto: el texto va en una tarjeta sólida aparte */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="max-w-2xl rounded-2xl bg-primary-900 p-6 text-left shadow-xl sm:p-10">
          <h1 className="font-heading text-3xl font-semibold sm:text-4xl md:text-5xl lg:text-6xl">
            Llevando agua potable a cada hogar de Pueblo Nuevo
          </h1>
          <p className="mt-5 text-lg text-primary-100">
            Consulta avisos, reporta averías y conoce nuestros servicios desde
            un solo lugar. El agua que llega a tu hogar, cuidada con
            transparencia todos los días.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#servicios"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-50"
            >
              Ver servicios
            </a>
            <Link
              to="/reportar-averia"
              className="rounded-full border border-white px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white hover:text-primary-700"
            >
              Reportar avería
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero

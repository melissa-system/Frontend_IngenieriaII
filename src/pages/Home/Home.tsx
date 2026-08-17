import Hero from '../../components/Hero/Hero'
import AboutUs from '../../components/AboutUs/AboutUs'
import Services from '../../components/Services/Services'
import News from '../../components/News/News'
import Location from '../../components/Location/Location'

function Home() {
  return (
    <div>
      <Hero />
      <AboutUs />
      <Services />
      <News />
      <Location />
    </div>
  )
}

export default Home

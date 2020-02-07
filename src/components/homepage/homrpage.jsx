import React, { Component } from 'react'
import { Row, Col, Card, Checkbox, Slider, Icon, Result, Button } from 'antd'
import axios from "axios"
import { appDetails } from '../../config/config'

export default class Homrpage extends Component {
  constructor(props) {
    super(props)
    this.state = {
      genres: [],
      movies: [],
      currentlyShowing: [],
      moviesBasedOnDefaultRating: [],
      moviesBasedOnPopularity: [],
      preload: true,
      genreWanted: [],
      inputValue: 3
    }
  }

  componentDidMount() {
    this.canclePreload()
    this.getGeneres()
    this.getMovies()
  }

  // filter movies to be shown based on the slider value
  sliderOnChange = (value) => {
    const { moviesBasedOnPopularity } = this.state

    // filter the movies in "moviesBasedOnPopularity" based on the value from the slider into "currentlyShowing"
    let currentlyShowing = moviesBasedOnPopularity.filter((movie) => Math.round(movie.vote_average) >= Math.round(value))

    // update state
    this.setState({
      currentlyShowing,
      inputValue: value,
      genreWanted: []
    })
  };

  // filter movies to be shown based on the genre checkbox
  checkBoxOnChange = (e, genreId) => {
    const { moviesBasedOnPopularity, genreWanted } = this.state
    let newGenreWanted = genreWanted
    let currentlyShowing = []

    // check if the just chosen "genre" chosen by the user is already availble in the "genreWanted"
    // if its not already available add the id of the "genreWanted" array
    if (newGenreWanted.includes(genreId)) {

      // if its available remove it from the array of "genreWanted"
      const index = newGenreWanted.indexOf(genreId);
      if (index > -1) {
        newGenreWanted.splice(index, 1);
      }
    } else {
      newGenreWanted.push(genreId)
    }

    // filter the movies in "moviesBasedOnPopularity" that has all the generes in the genres in the "genreWanted"  into the "currentlyShowing"
    currentlyShowing = moviesBasedOnPopularity.filter((movie) => newGenreWanted.every(genre => movie.genre_ids.includes(genre)))

    // update state
    this.setState({
      currentlyShowing,
      genreWanted: newGenreWanted,
      inputValue: 3
    })
  }

  // control initial preloader 
  canclePreload = () => {
    setTimeout(() => {
      this.setState({
        preload: false
      })
    }, 1500);
  }

  // get genres list from TMDB
  getGeneres = () => {

    // make api call to the the genres list
    axios.get(`https://api.themoviedb.org/3/genre/movie/list?api_key=${appDetails.apiKey}&language=en-US`).then((res) => {

      // update state
      this.setState({
        genres: res.data.genres
      })
    }).catch((err) => {
      console.log(err)
    })
  }

  // get movies list from TMDB
  getMovies = () => {

    // make api call to the the movies list
    axios.get(`https://api.themoviedb.org/3/movie/now_playing?api_key=${appDetails.apiKey}&language=en-US&page=1`).then((res) => {

      // get initial movie list 
      let movies = res.data.results

      // filter the movies list to get only movies that have ratings this within the range of 0 and 10 
      let moviesBasedOnRangeRatings = movies.filter((movie) => Math.round(movie.vote_average) <= 10)

      // filter the movies in "moviesBasedOnRangeRatings" based on movie popularity (from highest to loweest)
      let moviesBasedOnPopularity = moviesBasedOnRangeRatings.sort((a, b) => b.popularity - a.popularity)

      // filter the movies in "moviesBasedOnPopularity" based on the default slider value which is 3, this becomes our default "currentlyShowing" 
      let moviesBasedOnDefaultRating = moviesBasedOnPopularity.filter((movie) => Math.round(movie.vote_average) >= 3)

      // update state
      this.setState({
        movies,
        moviesBasedOnPopularity,
        moviesBasedOnDefaultRating,
        currentlyShowing: moviesBasedOnDefaultRating
      })
    }).catch((err) => {
      console.log(err)
    })
  }

  // return list of all genres name based on genre id for each movie
  getGenereNames = (genreIds) => {
    const { genres } = this.state
    let genreDetails = []
    genreIds.forEach((genreId) => {
      genres.forEach((genre) => {
        if (genre.id === genreId) {
          genreDetails.push(genre.name)
        }
      });
    });
    return genreDetails.join(', ')
  }

  // return true or false for individual genre checkbox check attribute 
  // condition is if a particular genre is already in the "genreWanted" array
  isPresentInGenreWanted = (genreId) => {
    const { genreWanted } = this.state
    return genreWanted.includes(genreId)
  }

  // reset all filters
  resetFilters = (e) => {
    const { moviesBasedOnDefaultRating } = this.state
    e.preventDefault()

    // update state
    this.setState({
      genreWanted: [],
      currentlyShowing: moviesBasedOnDefaultRating,
      inputValue: 3
    })
  }

  render() {
    const { genres, currentlyShowing, preload, inputValue } = this.state
    return (
      preload ?
        <div className="x-loader">
          <Icon type="loading" style={{ fontSize: 60 }} spin />
        </div>
        :
        <div className="homepage">
          <div className="homepage-main">
            <h1 className="top-title">Movie App</h1>
            <Row gutter={16}>
              <Col lg={6} sm={24} md={8}>
                <Card className="review-holder">
                  <h3>Filter by Movie Review</h3>
                  <Slider value={inputValue} min={0} max={10} tooltipVisible tooltipPlacement="bottom" step={0.5} onChange={this.sliderOnChange} />
                </Card>
                <Card className="genre-holder">
                  <h3>Filter by Movie Genres</h3>
                  <ul>
                    {/* show all the gneres */}
                    {
                      genres.map((genre) => (
                        <li key={genre.id}>
                          <Checkbox checked={this.isPresentInGenreWanted(genre.id)} onChange={(e) => this.checkBoxOnChange(e, genre.id)}>{genre.name}</Checkbox>
                        </li>
                      ))
                    }
                  </ul>
                </Card>
              </Col>
              <Col lg={18} sm={24} md={16} className="movie-holder">
                <div className="top">
                  <h2>Movie List</h2>
                  <Button type="primary" onClick={(e) => this.resetFilters(e)}>Reset Filters</Button>
                </div>
                <Row gutter={16}>
                  {/* check of the currentlyShowing lenght is greater than 0, if yes, display the currentlyShowing else  display the warning */}
                  {
                    currentlyShowing.length > 0 ?
                      currentlyShowing.map((movie) => (
                        <Col lg={8} sm={24} md={12} key={movie.id}>
                          <Card
                            hoverable
                            cover={<img alt={movie.title} src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} />}
                          >
                            <h3 className="novie-title">{movie.title}</h3>
                            <span><b>Genres:</b> {this.getGenereNames(movie.genre_ids)}</span>
                          </Card>
                        </Col>
                      ))
                      :
                      <Result
                        status="warning"
                        title={<span className="warning-text">There are no movies under the selection you made.</span>}
                        extra={
                          <Button type="primary" onClick={(e) => this.resetFilters(e)}>Reset Filters</Button>
                        }
                      />
                  }
                </Row>
              </Col>
            </Row>
          </div>
        </div>
    )
  }
}

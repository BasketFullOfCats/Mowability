  import { useState, useEffect, useRef } from 'react'
  import './App.css'
  import './index.css'
  
  // () this is props, if we do have any, we initalize as ({date, weather})
  // => replaces function keyword
  //A parent node will do the algorithm to calc how good it is to mow that day, and pass it down to the DayCard node
  const DayCard = ({date, mowScore, icon, scoreBreakdown}) => {
    /* This state will be used to check if user wants to check a specific day. Basically checking the best time to mow that day */
    /* hasClicked -> check if user clicks on a certain day card. setHasClicked -> rerenders DOM */
    const [hasClicked, setHasClicked] = useState(false);
    return(
    <div className = 'day-card'
    style={{ backgroundColor: getScoreColor(mowScore) }}
    >
      <h2>{icon} {date}</h2>
      <h2>Mowability:{mowScore}</h2>
        <div className='score-breakdown'>
          <p>Base score: 100</p>
          <p>Rain chance today ({scoreBreakdown.rainChanceToday}%): -{scoreBreakdown.rainPenalty}</p>
          <p>Recent rain ({scoreBreakdown.recentRainMm}mm): -{scoreBreakdown.recentRainPenalty}</p>
          <p>Wind ({scoreBreakdown.windSpeed} km/h): -{scoreBreakdown.windPenalty}</p>
          <p>Temp bonus ({scoreBreakdown.maxTemp}°): +{scoreBreakdown.tempBonus}</p>
        </div>
    </div>
    )
  }


  /* This will add color to our day cards */
  const getScoreColor = (score) => {
    if (score <= 50) return '#e74c3c';       // red
    if (score <= 60) return '#e67e22';       // orange
    if (score <= 70) return '#f1c40f';       // yellow
    if (score <= 80) return '#a3cf3c';       // yellow-green
    return '#2ecc71';                        // green
  };

  

  /* This will use our localhost python backend to fetch data */
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  /* This will be our search bar for users */
  const AddressSearch = ({onSelectLocation}) =>{
    /* So this will hold the location object when user clicks from suggestion list. We will then use this obj when we click submit */
    const [pendingLocation, setPendingLocation] = useState(null);
    /* So this will automatically "reclick" the textbox after user clicks on suggestions */
    const inputRef = useRef(null);
    /* this prevents the suggestions to re-render the address in the dropdown when we click on a suggestion */
    const [isSelected, setIsSelected] = useState(false);

    /* This will hold the state variable to hold input */
    const [addressInput, setAddressInput] = useState('');

    /* This will hold the suggestions that our api will fetch */
    const [suggestions, setSuggestions] = useState([]);

    /* This will handle update states when user types each keystroke */
    const handleInputChange = (event) =>{
      console.log("input changed:", event.target.value);
      setAddressInput(event.target.value);
      setIsSelected(false);
      /* User retypes so then we have to clear previous object until he selects another location from dropdown */
      setPendingLocation(null);
    };

    /* This will handle when user presses enter/submit */
    const handleSearch = (event) =>{
      event.preventDefault();
      if(addressInput.trim() !== ''){
        setSuggestions([]);
      }
      if(pendingLocation){
        /* Now we will tell our app to fetch the forecast */
        onSelectLocation(pendingLocation);
      }
    };



    
    useEffect(() => {
      /* This will trim any useless whitespace and populate the array of suggestions or when we click using suggestion dropdown*/
      if(isSelected || addressInput.trim() === ''){
        setSuggestions([]);
        return;
      }
        /* 
        After a 300ms delay(debouncing to limit fetch spam), we use filter on our dataset which loops over every element and checks if it matches user input
        First we take each element -> convert to lowercase -> take user input -> convert to lower case -> and if it matches, we populate it in the array, which we do in setSuggestions
        */
      const timer = setTimeout(async () =>{
        try{
          const response = await fetch(
            /* {Backend server} api endpoint. encode allows us js to convert special chars into safe characters. Then query searches the input */
            `${API_BASE_URL}/api/address-autocomplete?q=${encodeURIComponent(addressInput)}`
          );
          if(response.ok){
            const data = await response.json();
            /* FastAPI returns objects stored in suggestions array... so {"suggestions": [{formattedAddress, lat, lon}, ...]} */
            setSuggestions(data.suggestions || []);
          }
        }
        catch(error){
          console.error("Failed to get address suggestions", error);
        }
      }, 300);
      return () => clearTimeout(timer);
    }, [addressInput,isSelected]);
    

    const handleSelectSuggestion = (locationObject) => {
      /* set the input as the one they clicked */
      setAddressInput(locationObject.formattedAddress);
      /* set flag as true to prevent useEffect from re-fetching */
      setIsSelected(true);
      /* clear suggestions array */
      setSuggestions([]);
      /* Hold the location object locally */
      setPendingLocation(locationObject);

      /* refocuses the textbox after handling selection */
      if(inputRef.current){
        inputRef.current.focus();
      }
    };

    return(
      <div className = 'search-bar'>
        <form onSubmit={handleSearch}>
        <input 
        ref={inputRef}
        type='text'
        placeholder='Please enter your address...'
        value = {addressInput}
        onChange={handleInputChange}
        />
        <button type='submit'>Search</button>
        </form>

        {suggestions.length > 0 && (
          <ul className='suggestion-dropdown'>
            {suggestions.map((object, index) => (
              <li 
              key={index}
              onClick={() => handleSelectSuggestion(object)}
              >
                {object.formattedAddress}
              </li>
            ))}
          </ul>
          )
        }
      </div>
    )
  }



  const App = () => {

    /* This will store the location object we get from FastAPI */
    const [selectedLocation, setSelectedLocation] = useState(null);
    /* This will be an array that holds the mowability scores */
    const [forecast, setForecast] = useState([]);
    /* Check if backend api request is in progress because we will do heavy calculations there */
    const [loadingForecast, setLoadingForecast] = useState(false);
    /* Now we need to handle searchedAddress */

    useEffect(() => {
      if(!selectedLocation) return;

      const fetchMowability = async () =>{
        setLoadingForecast(true);
        try{
          /* use our api to fetch the weather using long/lat */
          const response = await fetch(
            `${API_BASE_URL}/api/mowability?lat=${selectedLocation.lat}&lon=${selectedLocation.lon}`
          );
          if (response.ok){
            const data = await response.json();
            setForecast(data.forecast || []);
          }
        }
        catch (error){
          console.error("Failed fetching Mowability score", error);
        }
        finally{
          setLoadingForecast(false);
        }
      };
      fetchMowability();
      /* Dependency will be on our location */
    },[selectedLocation]);

    return (
      <div className="card-container">
      <h2>Mowability, 5 day weather probability of the best time to mow your lawn</h2>
      <AddressSearch onSelectLocation={setSelectedLocation}/>
      {loadingForecast && <p>Fetching Mowability scores...</p>}
      {!loadingForecast && forecast.length > 0 && (
        <div className='card-container'>
          {forecast.map((day, index) =>(
            <DayCard 
              key = {index}
              date = {day.date}
              mowScore={day.mowScore}
              icon = {day.icon}
              scoreBreakdown={day.scoreBreakdown}
              />
          ))}
          </div>
      )}
    </div>
    );
  };

  export default App
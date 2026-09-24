This is a full stack project that calculates the best day to mow the lawn.

It can only look **up to 5 days a head** since the weatherAPI tier that I use only allows for 7 day forecast, and 2 are 
needed to account for any rainfall that might be retained in the soil or grass.

**Backend uses python and fastAPI**.  
-We use two services, **Nominatim** and **weatherAPI**.  
-**Nominatim**: we use to autofill the location of the user real time. It also gives us an accurate long/lat that we can use to find their weather forecast  
-**WeatherAPI**: Using the data that we get from Nominatim, we can accurately get their weather forecast and then use that data to calculate their "mowability" 5 days in advance   
-For the **score calculations**, I did ask **gemini** to implement my design, ie give it what it should do and tweak it a little bit since it did
not account for previous rain or the weighting of each day(1st previous day more important than 2nd day b/c it has more time to dry). It also did the get weather icon function.

**Frontend uses Javascript**  
-Basic user interface that requires no login since it was made **locally**, so only I would be using it  
-**Day cards** to hold all the **objects** we get when we use **weatherAPI**. Basically each object will contain that weather's day, which then we use to calculate/display  
-Also made a real time autofill, basically we select the top 10 results that matches the users input **only** after a 300ms delay so we dont constantly keep sending fetch requests, allows us
to limit api usage and stop the website from blocking us, potentially thinking were a bot  
-Made some QoL changes as well, mainly using ref to refocus onto the input box when user hits enter to submit. 

Inspiration: Helping out at my parents restaurant 6 days a week and the day off is just to mow the lawn. With the long hours, and working in a different city than home, it is hard to keep track and find the most optimal day to mow the lawn. Also wanted to build a full stack using react.

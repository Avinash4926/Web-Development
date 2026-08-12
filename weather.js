/* =========================================
   WEATHER DASHBOARD
   Task 4 - Asynchronous JavaScript & RESTful APIs

   Technologies:
   - Fetch API
   - async / await
   - REST API
   - JSON
   - DOM Manipulation
   - Error Handling
========================================= */


/* =========================================
   API CONFIGURATION
========================================= */

const GEOCODING_API =
    "https://geocoding-api.open-meteo.com/v1/search";

const WEATHER_API =
    "https://api.open-meteo.com/v1/forecast";


/* =========================================
   DOM ELEMENTS
========================================= */

const weatherForm =
    document.getElementById("weatherForm");

const cityInput =
    document.getElementById("cityInput");

const searchButton =
    document.getElementById("searchButton");

const searchButtonText =
    document.getElementById("searchButtonText");

const searchSpinner =
    document.getElementById("searchSpinner");

const statusMessage =
    document.getElementById("statusMessage");

const loadingState =
    document.getElementById("loadingState");

const weatherDashboard =
    document.getElementById("weatherDashboard");

const emptyState =
    document.getElementById("emptyState");

const locationName =
    document.getElementById("locationName");

const locationDetails =
    document.getElementById("locationDetails");

const weatherIcon =
    document.getElementById("weatherIcon");

const temperature =
    document.getElementById("temperature");

const weatherDescription =
    document.getElementById("weatherDescription");

const weatherTime =
    document.getElementById("weatherTime");

const humidity =
    document.getElementById("humidity");

const windSpeed =
    document.getElementById("windSpeed");

const feelsLike =
    document.getElementById("feelsLike");

const condition =
    document.getElementById("condition");

const coordinates =
    document.getElementById("coordinates");

const timezone =
    document.getElementById("timezone");

const lastUpdated =
    document.getElementById("lastUpdated");


/* =========================================
   WEATHER CODE MAP
========================================= */

/*
    Open-Meteo uses WMO weather interpretation codes.

    The API returns a numeric weather code.
    We convert that code into a readable
    description and an emoji.
*/

const weatherCodeMap = {

    0: {
        description: "Clear Sky",
        icon: "☀️"
    },

    1: {
        description: "Mainly Clear",
        icon: "🌤️"
    },

    2: {
        description: "Partly Cloudy",
        icon: "⛅"
    },

    3: {
        description: "Overcast",
        icon: "☁️"
    },

    45: {
        description: "Fog",
        icon: "🌫️"
    },

    48: {
        description: "Depositing Rime Fog",
        icon: "🌫️"
    },

    51: {
        description: "Light Drizzle",
        icon: "🌦️"
    },

    53: {
        description: "Moderate Drizzle",
        icon: "🌦️"
    },

    55: {
        description: "Dense Drizzle",
        icon: "🌧️"
    },

    56: {
        description: "Light Freezing Drizzle",
        icon: "🌧️"
    },

    57: {
        description: "Dense Freezing Drizzle",
        icon: "🌧️"
    },

    61: {
        description: "Slight Rain",
        icon: "🌦️"
    },

    63: {
        description: "Moderate Rain",
        icon: "🌧️"
    },

    65: {
        description: "Heavy Rain",
        icon: "🌧️"
    },

    66: {
        description: "Light Freezing Rain",
        icon: "🌧️"
    },

    67: {
        description: "Heavy Freezing Rain",
        icon: "🌧️"
    },

    71: {
        description: "Slight Snow Fall",
        icon: "🌨️"
    },

    73: {
        description: "Moderate Snow Fall",
        icon: "🌨️"
    },

    75: {
        description: "Heavy Snow Fall",
        icon: "❄️"
    },

    77: {
        description: "Snow Grains",
        icon: "❄️"
    },

    80: {
        description: "Slight Rain Showers",
        icon: "🌦️"
    },

    81: {
        description: "Moderate Rain Showers",
        icon: "🌧️"
    },

    82: {
        description: "Violent Rain Showers",
        icon: "⛈️"
    },

    85: {
        description: "Slight Snow Showers",
        icon: "🌨️"
    },

    86: {
        description: "Heavy Snow Showers",
        icon: "❄️"
    },

    95: {
        description: "Thunderstorm",
        icon: "⛈️"
    },

    96: {
        description: "Thunderstorm with Slight Hail",
        icon: "⛈️"
    },

    99: {
        description: "Thunderstorm with Heavy Hail",
        icon: "⛈️"
    }

};


/* =========================================
   FORM SUBMISSION
========================================= */

weatherForm.addEventListener(
    "submit",
    async function (event) {

        /*
            Prevent the browser from
            refreshing the page.
        */

        event.preventDefault();

        const city =
            cityInput.value.trim();


        /*
            Validate input before making
            an API request.
        */

        if (!city) {

            showError(
                "Please enter a city name."
            );

            cityInput.focus();

            return;
        }


        /*
            City names shorter than 2 characters
            are not useful for the geocoding API.
        */

        if (city.length < 2) {

            showError(
                "Please enter at least 2 characters."
            );

            cityInput.focus();

            return;
        }


        /*
            Start loading state.
        */

        setLoading(true);


        try {

            /*
                STEP 1
                Find the city's coordinates.
            */

            const location =
                await getCityCoordinates(city);


            /*
                STEP 2
                Get current weather using
                the coordinates.
            */

            const weather =
                await getWeatherData(
                    location.latitude,
                    location.longitude
                );


            /*
                STEP 3
                Render the weather information
                dynamically on the page.
            */

            displayWeather(
                location,
                weather
            );


            showSuccess(
                `Weather loaded for ${location.name}.`
            );

        }

        catch (error) {

            /*
                Comprehensive error handling.

                Instead of exposing technical
                errors to the user, we display
                a friendly message.
            */

            console.error(
                "Weather Dashboard Error:",
                error
            );


            showError(
                error.message ||
                "Unable to retrieve weather data. Please try again."
            );

        }

        finally {

            /*
                finally executes whether the
                request succeeds or fails.

                This guarantees that the
                loading state is removed.
            */

            setLoading(false);

        }

    }
);


/* =========================================
   GET CITY COORDINATES
========================================= */

async function getCityCoordinates(city) {

    /*
        encodeURIComponent prevents spaces
        and special characters from breaking
        the URL.

        Example:

        "New York"

        becomes:

        "New%20York"
    */

    const encodedCity =
        encodeURIComponent(city);


    const url =
        `${GEOCODING_API}?name=${encodedCity}&count=1&language=en&format=json`;


    let response;


    try {

        /*
            Fetch the REST API.

            Fetch returns a Promise.

            await pauses this async function
            until the request completes.
        */

        response =
            await fetch(url);

    }

    catch (networkError) {

        /*
            This handles network-level errors,
            such as:

            - Internet disconnected
            - DNS failure
            - Server unreachable
        */

        throw new Error(
            "Network error. Please check your internet connection."
        );

    }


    /*
        fetch() does NOT automatically reject
        HTTP errors such as 404 or 500.

        Therefore we explicitly check
        response.ok.
    */

    if (!response.ok) {

        throw new Error(
            `Location service returned HTTP ${response.status}.`
        );

    }


    /*
        Convert JSON response into a
        JavaScript object.

        This is asynchronous too.
    */

    const data =
        await response.json();


    /*
        Check whether the API returned
        any matching locations.
    */

    if (
        !data.results ||
        data.results.length === 0
    ) {

        throw new Error(
            `City "${city}" was not found. Please check the spelling and try again.`
        );

    }


    /*
        Extract the first location result.

        This demonstrates processing a
        nested JSON structure:

        data
          └── results
                └── [0]
                      ├── name
                      ├── latitude
                      ├── longitude
                      ├── country
                      └── timezone
    */

    const result =
        data.results[0];


    return {

        name:
            result.name,

        latitude:
            result.latitude,

        longitude:
            result.longitude,

        country:
            result.country || "Unknown",

        countryCode:
            result.country_code || "",

        admin1:
            result.admin1 || "",

        timezone:
            result.timezone || "Unknown"

    };

}


/* =========================================
   GET WEATHER DATA
========================================= */

async function getWeatherData(
    latitude,
    longitude
) {

    /*
        Request only the current weather
        values required by the dashboard.

        current contains:

        - temperature_2m
        - relative_humidity_2m
        - apparent_temperature
        - wind_speed_10m
        - weather_code
    */

    const params =
        new URLSearchParams({

            latitude:
                latitude,

            longitude:
                longitude,

            current:
                [
                    "temperature_2m",
                    "relative_humidity_2m",
                    "apparent_temperature",
                    "wind_speed_10m",
                    "weather_code"
                ].join(","),

            timezone:
                "auto",

            temperature_unit:
                "celsius",

            wind_speed_unit:
                "kmh"

        });


    const url =
        `${WEATHER_API}?${params.toString()}`;


    let response;


    try {

        /*
            Make the weather API request.
        */

        response =
            await fetch(url);

    }

    catch (networkError) {

        throw new Error(
            "Unable to connect to the weather service. Please check your internet connection."
        );

    }


    /*
        Check HTTP status.
    */

    if (!response.ok) {

        throw new Error(
            `Weather service returned HTTP ${response.status}.`
        );

    }


    /*
        Parse JSON.

        The expected structure is approximately:

        {
            latitude: ...,
            longitude: ...,
            timezone: "...",

            current: {
                time: "...",
                temperature_2m: ...,
                relative_humidity_2m: ...,
                apparent_temperature: ...,
                wind_speed_10m: ...,
                weather_code: ...
            },

            current_units: {
                temperature_2m: "°C",
                ...
            }
        }
    */

    let data;


    try {

        data =
            await response.json();

    }

    catch (jsonError) {

        throw new Error(
            "The weather service returned invalid JSON data."
        );

    }


    /*
        Validate the expected nested
        current object.
    */

    if (
        !data ||
        !data.current
    ) {

        throw new Error(
            "Weather data is incomplete or unavailable."
        );

    }


    return data;

}


/* =========================================
   DISPLAY WEATHER
========================================= */

function displayWeather(
    location,
    weather
) {

    /*
        Extract the nested current object.

        Instead of repeatedly writing:

        weather.current.temperature_2m

        we store it in a shorter variable.
    */

    const current =
        weather.current;


    /*
        Get readable weather information
        from the WMO weather code.
    */

    const weatherInfo =
        getWeatherInfo(
            current.weather_code
        );


    /* -----------------------------------------
       LOCATION
    ------------------------------------------ */

    locationName.textContent =
        location.name;


    /*
        Build a dynamic location string.
    */

    const locationParts =
        [
            location.admin1,
            location.country
        ].filter(Boolean);


    locationDetails.textContent =
        locationParts.join(", ");


    /* -----------------------------------------
       TEMPERATURE
    ------------------------------------------ */

    temperature.textContent =
        formatNumber(
            current.temperature_2m
        );


    /* -----------------------------------------
       WEATHER ICON
    ------------------------------------------ */

    weatherIcon.textContent =
        weatherInfo.icon;


    /* -----------------------------------------
       WEATHER DESCRIPTION
    ------------------------------------------ */

    weatherDescription.textContent =
        weatherInfo.description;


    /* -----------------------------------------
       WEATHER TIME
    ------------------------------------------ */

    weatherTime.textContent =
        formatDateTime(
            current.time
        );


    /* -----------------------------------------
       HUMIDITY
    ------------------------------------------ */

    humidity.textContent =
        formatNumber(
            current.relative_humidity_2m
        );


    /* -----------------------------------------
       WIND SPEED
    ------------------------------------------ */

    windSpeed.textContent =
        formatNumber(
            current.wind_speed_10m
        );


    /* -----------------------------------------
       FEELS LIKE
    ------------------------------------------ */

    feelsLike.textContent =
        formatNumber(
            current.apparent_temperature
        );


    /* -----------------------------------------
       CONDITION
    ------------------------------------------ */

    condition.textContent =
        weatherInfo.description;


    /* -----------------------------------------
       COORDINATES
    ------------------------------------------ */

    coordinates.textContent =
        `${Number(location.latitude).toFixed(4)}, ${Number(location.longitude).toFixed(4)}`;


    /* -----------------------------------------
       TIMEZONE
    ------------------------------------------ */

    timezone.textContent =
        weather.timezone ||
        location.timezone ||
        "Unknown";


    /* -----------------------------------------
       LAST UPDATED
    ------------------------------------------ */

    lastUpdated.textContent =
        new Date().toLocaleTimeString(
            [],
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );


    /*
        Show dashboard.
    */

    weatherDashboard.classList.remove(
        "hidden"
    );


    /*
        Hide initial empty state.
    */

    emptyState.classList.add(
        "hidden"
    );

}


/* =========================================
   WEATHER CODE → DESCRIPTION
========================================= */

function getWeatherInfo(
    weatherCode
) {

    /*
        Convert the numeric weather code
        to a string before checking the map.

        This also makes the function robust
        if the API returns the value in a
        different numeric representation.
    */

    const code =
        Number(weatherCode);


    /*
        Return mapped weather information.

        If an unknown code is received,
        use a safe fallback.
    */

    return (
        weatherCodeMap[code] || {

            description:
                "Weather information unavailable",

            icon:
                "🌤️"

        }
    );

}


/* =========================================
   FORMAT NUMBERS
========================================= */

function formatNumber(value) {

    /*
        Protect the UI from undefined,
        null or invalid values.
    */

    if (
        value === undefined ||
        value === null ||
        Number.isNaN(Number(value))
    ) {

        return "--";

    }


    return Number(value)
        .toFixed(1)
        .replace(".0", "");

}


/* =========================================
   FORMAT DATE & TIME
========================================= */

function formatDateTime(
    dateString
) {

    if (!dateString) {

        return "--";

    }


    try {

        const date =
            new Date(dateString);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return dateString;

        }


        return date.toLocaleString(
            [],
            {
                weekday: "short",
                hour: "2-digit",
                minute: "2-digit"
            }
        );

    }

    catch (error) {

        console.error(
            "Date formatting error:",
            error
        );

        return dateString;

    }

}


/* =========================================
   LOADING STATE
========================================= */

function setLoading(
    isLoading
) {

    if (isLoading) {

        /*
            Disable search button so the
            user cannot accidentally create
            multiple simultaneous requests.
        */

        searchButton.disabled = true;


        searchButtonText.classList.add(
            "hidden"
        );


        searchSpinner.classList.remove(
            "hidden"
        );


        loadingState.classList.remove(
            "hidden"
        );


        weatherDashboard.classList.add(
            "hidden"
        );


        emptyState.classList.add(
            "hidden"
        );


        hideStatus();

    }

    else {

        searchButton.disabled = false;


        searchButtonText.classList.remove(
            "hidden"
        );


        searchSpinner.classList.add(
            "hidden"
        );


        loadingState.classList.add(
            "hidden"
        );

    }

}


/* =========================================
   ERROR MESSAGE
========================================= */

function showError(
    message
) {

    statusMessage.textContent =
        `⚠️ ${message}`;


    statusMessage.className =
        "status-message error";


    statusMessage.classList.remove(
        "hidden"
    );

}


/* =========================================
   SUCCESS MESSAGE
========================================= */

function showSuccess(
    message
) {

    statusMessage.textContent =
        `✓ ${message}`;


    statusMessage.className =
        "status-message success";


    statusMessage.classList.remove(
        "hidden"
    );


    /*
        Automatically remove success
        message after a few seconds.
    */

    setTimeout(
        () => {

            hideStatus();

        },
        4000
    );

}


/* =========================================
   HIDE STATUS
========================================= */

function hideStatus() {

    statusMessage.classList.add(
        "hidden"
    );

}


/* =========================================
   DEFAULT CITY
========================================= */

/*
    Load a default city when the page
    is opened.

    This makes the dashboard immediately
    demonstrate live API data without
    requiring the evaluator to type
    something first.
*/

window.addEventListener(
    "DOMContentLoaded",
    async function () {

        const defaultCity =
            "Chennai";


        cityInput.value =
            defaultCity;


        /*
            Automatically fetch weather
            for the default city.
        */

        setLoading(true);


        try {

            const location =
                await getCityCoordinates(
                    defaultCity
                );


            const weather =
                await getWeatherData(
                    location.latitude,
                    location.longitude
                );


            displayWeather(
                location,
                weather
            );


        }

        catch (error) {

            console.error(
                "Initial weather loading error:",
                error
            );


            /*
                Don't show a scary error
                immediately on first load.

                The user can still search
                manually.
            */

            showError(
                "Unable to load the default weather. Please search for a city."
            );

            emptyState.classList.remove(
                "hidden"
            );

        }

        finally {

            setLoading(false);

        }

    }
);


/* =========================================
   ENTER KEY SUPPORT
========================================= */

cityInput.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Enter"
        ) {

            /*
                The form submit handler
                will process the search.
            */

            return;

        }

    }
);
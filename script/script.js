async function nactipocasi() {
    const url = "https://api.open-meteo.com/v1/forecast?latitude=49.5955&longitude=17.2518&current=temperature_2m&timezone=Europe%2FBerlin";
    const odpoved = await fetch(url);
    const data = await odpoved.json();
    const teplota = data.current.temperature_2m;
    document.getElementById("tempValue").textContent = teplota + "°C";
    
}

nactipocasi();
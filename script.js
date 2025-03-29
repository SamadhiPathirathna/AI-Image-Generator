// Select elements
const themeToggle = document.querySelector(".theme-toggle");
const promptForm = document.querySelector(".prompt-form");
const promptInput = document.querySelector(".prompt-input");
const promptBtn = document.querySelector(".prompt-btn");
const generationBtn = document.querySelector(".generate-btn");
const modelSelect = document.getElementById("model-select");
const countSelect = document.getElementById("count-select");
const ratioSelect = document.getElementById("ratio-select");
const gridGallery = document.querySelector(".gallery-grid"); 
const API_KEY = "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";


const examplePrompts = [
    "A magic forest with glowing plants and fairy homes among giant mushrooms",
    "An old steampunk airship floating through golden clouds at sunset",
    "A future Mars colony with glass domes and gardens against red mountains",
    "A dragon sleeping on gold coins in a crystal cave",
    "An underwater kingdom with merpeople and glowing coral buildings",
    "A floating island with waterfalls pouring into clouds below",
    "A witch's cottage in fall with magic herbs in the garden",
    "A robot painting in a sunny studio with art supplies around it",
    "A magical library with floating glowing books and spiral staircases",
    "A Japanese shrine during cherry blossom season with lanterns and misty mountains",
    "A cosmic beach with glowing sand and an aurora in the night sky",
    "A medieval marketplace with colorful tents and street performers",
    "A cyberpunk city with neon signs and flying cars at night",
    "A peaceful bamboo forest with a hidden ancient temple",
    "A giant turtle carrying a village on its back in the ocean",
];

// Debugging: Ensure elements exist
console.log("Model Select Element:", modelSelect);
console.log("Available Models:", [...modelSelect.options].map(opt => opt.value));


// Set the theme based on preference
(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    
    const isDarkTheme = savedTheme === "dark" || (!savedTheme && systemPrefersDark);
    document.body.classList.toggle("dark-theme", isDarkTheme);
    themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
})();

// Toggle between light and dark theme
const toggleTheme = () => {
    const isDarkTheme = document.body.classList.toggle("dark-theme");
    localStorage.setItem("theme", isDarkTheme ? "dark" : "light");
    themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
};

//Calculate width/height based on chosen ratio

const getImageDimensions =(aspectRatio ,baseSize=512) =>{
    const [width,height] = aspectRatio.split("/").map(Number);
    const scaleFactor= baseSize / Math.sqrt(width * height);

    let calculateWidth = Math.round(width * scaleFactor);
    let calculateHeight = Math.round(height * scaleFactor);

    //Ensure dimesions are multiple of 16 (Ai model requirements)
    calculateWidth = Math.floor(calculateWidth / 16) * 16;
    calculateHeight = Math.floor(calculateHeight / 16) * 16;

    return{width: calculateWidth, height:calculateHeight };

};

 // Replace loading spinner with the actual image
const updateImageCard = (imageIndex, imgUrl) => {
    const imgCard = document.getElementById(`img-card-${imageIndex}`);
    if (!imgCard) return;

    imgCard.classList.remove("loading");
    imgCard.innerHTML = `
        <img src="${imgUrl}" class="result-img" />
        <div class="img-overlay">
            <a href="${imgUrl}" class="img-download-btn" download="generated-image-${Date.now()}.png">
                <i class="fa-solid fa-download"></i>
            </a>
        </div>`;
};

// Send request to API to create images
let generateImages = async (selectedModel, imageCount, aspectRatio, promptText) => {
    const MODEL_URL = `https://api-inference.huggingface.co/models/${selectedModel}`;
    const { width, height } = getImageDimensions(aspectRatio);
    generationBtn.setAttribute("disabled", "true");

    // Create an array of image generation promises
    const imagePromises = Array.from({ length: imageCount }, async (_, i) => {
        try {
            const response = await fetch(MODEL_URL, {
                headers: {
                    Authorization: `Bearer ${API_KEY}`,
                    "Content-Type": "application/json"
                },
                method: "POST",
                body: JSON.stringify({
                    inputs: promptText,
                    parameters: { width, height },
                    options: { wait_for_model: true, use_cache: false }
                }),
            });

            if (!response.ok) {
                throw new Error((await response.json())?.error || "Unknown error occurred");
            }

            // Convert response to an image URL and update the image card
            const result = await response.blob(); // Receive the image as a binary blob
            updateImageCard(i, URL.createObjectURL(result));
        } catch (error) {
            console.error("Error generating image:", error);
            const imgCard= document.getElementById(`img-card-${i}`);
            imgCard.classList.replace("loading" , "error");
            imgCard.querySelector(".status-text").textContent = "Genaration failed! Check console for more details";
        }
    });

    await Promise.allSettled(imagePromises);
    generationBtn.removeAttribute("disabled");
};

// Create placeholder cards with loading spinner
const createImageCards = (selectedModel, imageCount, aspectRatio, promptText) => {
    gridGallery.innerHTML = ""; // Clear previous images

    for (let i = 0; i < imageCount; i++) {
        gridGallery.innerHTML += `
            <div class="img-card loading" id="img-card-${i}" style="aspect-ratio: ${aspectRatio};">
                <div class="status-container">
                    <div class="spinner"></div>
                    <i class="fa-solid fa-triangle-exclamation"></i>
                    <p class="static-text">Generating...</p>
                </div>
            </div>`;
    }

    // Call generateImages after creating placeholders
    generateImages(selectedModel, imageCount, aspectRatio, promptText);
};

// Handle form submission
const handleFormSubmit = (e) => {
    e.preventDefault();

    // Get form values
    const selectedModel = modelSelect.value;
    const imageCount = parseInt(countSelect.value) || 1;
    const aspectRatio = ratioSelect.value.replace(":", "/") || "1/1";
    const promptText = promptInput.value.trim();

    console.log("Selected Model After Submit:", selectedModel); // Debugging

    createImageCards(selectedModel, imageCount, aspectRatio, promptText);
};


// Fill prompt input with random examples
promptBtn.addEventListener("click", () => {
    const prompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
    promptInput.value = prompt;
    promptInput.focus();
});

// Debug: Ensure model selection is detected
modelSelect.addEventListener("change", () => {
    console.log("Model Changed To:", modelSelect.value);
});

// Event Listeners
promptForm.addEventListener("submit", handleFormSubmit);
themeToggle.addEventListener("click", toggleTheme);


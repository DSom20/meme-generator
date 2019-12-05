/*
Summary:
    Requirements:
        Submitting the form generates a meme. Can generate/display multiple memes.
        Submitting the form clears form inputs.
        Memes are individually deletable via some button.
    
    Implementation Notes:
        The delete button for each meme is essentially the meme itself.
            User can highlight meme for deletion via keyboard tab/enter, hover, or click/touch (if no hover).
            User can then keyboard enter or click/touch to confirm deletion.
        The nature of the "memes" generated:
            1) The memes are really pseudo-memes in the sense that the text is just an overlay on the image, not built into the image.
            2) Also, the program uses the images' natural dimensions up to a max-width of essentially the window width.
            3) Thus, the program implements some (admittedly inefficient) functions to make the text responsive to window width /image width as well, 
                    keeping the font size reasonably large while staying within the boundaries of the image.

*/

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DATA DEFINITIONS

/*
 A Meme is an HTML element with the class ".meme-container".
*/

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// GLOBAL CONSTANTS AND VARIABLES


const form = document.querySelector("form");
const memeGrid = document.querySelector(".meme-grid");
let oldWindowWidth = window.innerWidth;


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// PRIMARY EVENT LISTENERS, MEDIA QUERIES


form.addEventListener("submit", generateMeme); 
document.addEventListener("click", memeClickHandler);  //removes meme OR removes/adds curtain

// Meme-text is NOT inherently part of meme-image, just overlays it. 
// Upon generation, each meme's text is made to fit within the image dimensions.
// However! Image width is partially dependent on window screen width (Max-width of image is 100% containing block ~ screen width).
// Thus, image width might change if the window changes width after meme has been generated.
// If this happens, the text font-size will need to be adjusted to make sure it still fits within the new image dimensions
window.addEventListener("resize", adjustMemeTextSize); 

// Changes input placeholder text for smaller screen sizes
let mqlScreenWidth580 = window.matchMedia('(max-width: 580px)');
mqlScreenWidth580.addListener(screenWidth580Test);
screenWidth580Test(mqlScreenWidth580);

let mqlHover = window.matchMedia('(hover: hover)');


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// PRIMARY EVENT HANDLERS


function generateMeme(e){
    // Prevent form submission from reloading page
    e.preventDefault();

    // Generate Containers
    let memeContainer = document.createElement("button");
    let image = document.createElement("img");
    let textContainer = document.createElement("div");
    let topText = document.createElement("p");
    let bottomText = document.createElement("p");
    let curtain = document.createElement("div");

    // Prep img
    image.addEventListener("load", shrinkTextToFit); //is there a chance image could load BEFORE text is rendered at all? if so need to place this later...
    let imageInput = document.querySelector("#image-url");
    let imageURL = imageInput.value;
    image.setAttribute("src", imageURL);
    image.setAttribute("alt", "failed to load image");

    // Give top and bottom text p's their text and CSS
    let topTextInput = document.querySelector("#top-text");
    topText.innerText = topTextInput.value.toUpperCase();
    topText.classList.add("top-text");
    let bottomTextInput = document.querySelector("#bottom-text");
    bottomText.innerText = bottomTextInput.value.toUpperCase();
    bottomText.classList.add("bottom-text");

    // Give CSS to text container and append top and bottom text to it
    textContainer.classList.add("text-container");
    textContainer.appendChild(topText);
    textContainer.appendChild(bottomText);

    // Give delete container CSS
    curtain.classList.add("curtain");
    curtain.setAttribute("data-toggle-visibility", "false");

    // Give meme container CSS and event listener
    memeContainer.classList.add("meme-container");
    if(mqlHover.matches){
        memeContainer.addEventListener("mouseover", mouseOverHandler);
        memeContainer.addEventListener("mouseleave", mouseLeaveHandler);
    }


    // Add children to meme container
    memeContainer.appendChild(image);
    memeContainer.appendChild(textContainer);
    memeContainer.appendChild(curtain);

    // Add meme to grid
    memeGrid.appendChild(memeContainer);

    // Reset form values
    imageInput.value = null;
    topTextInput.value = null;
    bottomTextInput.value = null;
}

// Event --> Undefined
// Procedure: alter input placeholder values based on whether screen width is <= 580px
function screenWidth580Test(e) {
    let inputList = document.querySelectorAll("input");
    let topInput = inputList[1];
    let bottomInput = inputList[2];
    if (e.matches) {
        topInput.placeholder = "(Optional) Top Text";
        bottomInput.placeholder = "(Optional) Bottom Text";
    } else {
        topInput.placeholder = "(Optional) What text will go at the top of your meme?";
        bottomInput.placeholder = "(Optional) What text will go at the bottom of your meme?";
    }
}

// Undefined --> Undefined
// Procedure: if window width changed, adjust text size on each meme to ensure texts still fit within their meme containers
//   (Meme container size might have changed based on its image size changing, being partially responsive to window width)
function adjustMemeTextSize() {
    let currentWindowWidth = window.innerWidth;
    let memeList = document.querySelectorAll(".meme-container");
    if(currentWindowWidth < oldWindowWidth){
        memeList.forEach(shrinkTextToFit);
    } else if(currentWindowWidth > oldWindowWidth) {
        memeList.forEach(growTextToFit);
    }
    oldWindowWidth = currentWindowWidth;
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SECONDARY EVENT HANDLERS, SUB-1 HELPER FUNCTIONS


// Meme --> Undefined
// Procedure - Recursive:
//   Increase fontSize of meme text until either 
//      1) font size maxed out (40px),
//      2) OR text no longer fits inside meme container
//        2a) then decrease font size to backtrack
function growTextToFit(memeContainer){
    let fontSize = parseInt(window.getComputedStyle(memeContainer).getPropertyValue("font-size"));
    if(fontSize >= 40){
        return;
    } else if(!textFits(memeContainer)){
        shrinkTextToFit(memeContainer); //went too far last iteration, backtrack
    } else { //text has room to grow
        let newFontSize = fontSize + 1;
        memeContainer.style.fontSize = newFontSize + "px";
        growTextToFit(memeContainer);
    }
}

// Load-Event OR Meme  -> Undefined
// Procedure:
//   Given either load event from a meme-image OR a meme-container itself, shrink the text to fit the computed size of the meme/image
//   Decreases font-size of meme text to ensure it fits within the image dimensions
function shrinkTextToFit(eventOrMeme){
    let memeContainer;
    if(eventOrMeme.currentTarget){ //check if input is an Event
        let image = eventOrMeme.currentTarget;
        memeContainer = image.parentElement;
    } else { //assume input must be a memeContainer element
        memeContainer = eventOrMeme;
    }
    let styles = window.getComputedStyle(memeContainer);
    let originalFontSize = parseInt(styles.getPropertyValue("font-size"));
    shrinkTextToFitHelper(memeContainer, originalFontSize);     
}

// Meme Integer --> Undefined
// Procedure- Recursive: if text fits height-wise within its meme container, stop; else, decrease font size by one and iterate again
function shrinkTextToFitHelper(memeContainer, oldFontSize){
    if(textFits(memeContainer)){
        return;
    } else {
        let newFontSize = oldFontSize - 1;
        memeContainer.style.fontSize = newFontSize + "px";
        shrinkTextToFitHelper(memeContainer, newFontSize);
    }
}

// Meme -> Boolean
// Does meme text fit within its container?
function textFits(memeContainer) {
    let textContainer = memeContainer.children[1];
    let topText = textContainer.children[0];
    let bottomText = textContainer.children[1];
    let textHeight = topText.offsetHeight + bottomText.offsetHeight;
    let containerHeight = memeContainer.offsetHeight;
    return textHeight <= containerHeight;
}

// Click-event -> Undefined
// Procedure: 
//   Option 1) Meme with curtain is clicked --> delete that meme
//   Option 2) Anywhere else is clicked --> remove a curtain if it exists
//     Option 2a) A meme without a curtain is clicked --> add curtain to that meme
function memeClickHandler(e) {
    let memeElement = e.target.closest(".meme-container");
    if(memeElement && ownCurtainVisible(memeElement)) {
        deleteMeme(memeElement);
    }
    else {
        removeCurtain();
        if(memeElement){
            addCurtain(memeElement);
        }
    }
}

function mouseOverHandler(e) {
    let memeElement = e.currentTarget;
    removeCurtain();
    addCurtain(memeElement);
}

function mouseLeaveHandler(e) {
    let memeElement = e.currentTarget;
    removeCurtain();
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SUB-2 HELPER FUNCTIONS


// Meme --> Boolean
// Given a .meme-container element, is its .curtain child visible?
function ownCurtainVisible(memeElement) {
    let curtain = memeElement.children[2];
    let curtainStyles = window.getComputedStyle(curtain);
    return curtainStyles.getPropertyValue("visibility") === "visible";
}

// Meme --> Undefined
// Procedure: remove given element from HTML tree
function deleteMeme(memeElement){
    memeElement.remove();
}

// Undefined --> Undefined
// Procedure: if there is a .curtain that is visible, make it "hidden"
//   Note*: only selects first visible .curtain (...that's all there should be at any given time)
function removeCurtain(){
    let curtain = document.querySelector(".curtain[data-toggle-visibility='true']");
    if(curtain) {
        curtain.dataset.toggleVisibility = "false"; 
    }
}

// Meme --> Undefined
// Procedure: make a meme's .curtain visible
function addCurtain(memeElement){
    let curtain = memeElement.children[2];
    curtain.dataset.toggleVisibility = "true"; 
}


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// PREVIOUS SECTIONS / SOLUTIONS

//  Original click eventListener and eventHandler solution

// Rationale ---->

// Originally, click listeners were on each meme itself, not on document. 
// Functional, but two downsides:
// 1) if clicked a meme with curtain, would delete that meme AND THEN ALSO remove its curtain and add it back...pointless
// 2) In trying to cater to both tab and hover users, created unseemly scenario where could have two curtains up at once: 
//         one curtain on a meme that was tabbed and entered,
//         one on a different meme that is being hovered over.
// Solution:
// 1) Create a main clickHandler function that sorts logic flow, so that if delete-meme happens, then don't also pursue removeCurtain and addCurtain
// 2) Don't use CSS :hover. Rely only on JS mouseover/mouseleave events. Can then easily tell any curtain to close before adding one for hover

// Actual Code ----->

// document.addEventListener("click", deleteMeme);
// document.addEventListener("click", removeCurtain);
// document.addEventListener("click", addCurtain);

// Event -> Undefined   (Pure Procedure)
// Procedure: given (click) event, if target is (within) a meme, remove that meme from HTML tree
//  function deleteMeme(e) {
//     let memeElement = e.target.closest(".meme-container");
//     if(memeElement && curtainVisible(memeElement)) {
//         memeElement.remove();
//     }
// }


// Event --> Undefined  (Pure Procedure)
// Given (click) event, remove the single visible curtain, if it still exists
//  function removeCurtain(e) {
//     let memeElement = e.target.closest(".meme-container");
//     let curtain = document.querySelector(".curtain[data-toggle-visibility='true']");
//     if ((!memeElement && curtain) 
//         || (memeElement && curtain && curtain.parentElement !== memeElement)){
//         curtain.setAttribute("data-toggle-visibility", "false");
//     }
// }

// Event --> Undefined  (Pure Procedure)
// Given (click) event, add 
//  function addCurtain(e) {
//     let memeElement = e.target.closest(".meme-container");
//     if(memeElement) {
//         let curtain = memeElement.children[2];
//         curtain.setAttribute("data-toggle-visibility","true");
//     }
// }
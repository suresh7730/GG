/**
 * @license
 * Copyright 2018 Google LLC. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================================
 */

/********************************************************************
 * Demo created by Jason Mayes 2020.
 *
 * Got questions? Reach out to me on social:
 * Twitter: @jason_mayes
 * LinkedIn: https://www.linkedin.com/in/creativetech
 ********************************************************************/

const demosSection = document.getElementById('demos');

var model = undefined;

// Before we can use COCO-SSD class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.
cocoSsd.load().then(function (loadedModel) {
  model = loadedModel;
  // Show demo section now model is ready to use.
  demosSection.classList.remove('invisible');
});


/********************************************************************
// Demo 1: Grab a bunch of images from the page and classify them
// upon click.
********************************************************************/

// In this demo, we have put all our clickable images in divs with the 
// CSS class 'classifyOnClick'. Lets get all the elements that have
// this class.
const imageContainers = document.getElementsByClassName('classifyOnClick');

// Now let's go through all of these and add a click event listener.
for (let i = 0; i < imageContainers.length; i++) {
  // Add event listener to the child element whichis the img element.
  imageContainers[i].children[0].addEventListener('click', handleClick);
}

// When an image is clicked, let's classify it and display results!
function handleClick(event) {
  if (!model) {
    console.log('Wait for model to load before clicking!');
    return;
  }
  
  // We can call model.classify as many times as we like with
  // different image data each time. This returns a promise
  // which we wait to complete and then call a function to
  // print out the results of the prediction.
  model.detect(event.target).then(function (predictions) {
    // Lets write the predictions to a new paragraph element and
    // add it to the DOM.
    console.log(predictions);
    for (let n = 0; n < predictions.length; n++) {
      // Description text
      const p = document.createElement('p');
      p.innerText = predictions[n].class  + ' - with ' 
          + Math.round(parseFloat(predictions[n].score) * 100) 
          + '% confidence.';
      // Positioned at the top left of the bounding box.
      // Height is whatever the text takes up.
      // Width subtracts text padding in CSS so fits perfectly.
      p.style = 'left: ' + predictions[n].bbox[0] + 'px;' + 
          'top: ' + predictions[n].bbox[1] + 'px; ' + 
          'width: ' + (predictions[n].bbox[2] - 10) + 'px;';

      const highlighter = document.createElement('div');
      highlighter.setAttribute('class', 'highlighter');
      highlighter.style = 'left: ' + predictions[n].bbox[0] + 'px;' +
          'top: ' + predictions[n].bbox[1] + 'px;' +
          'width: ' + predictions[n].bbox[2] + 'px;' +
          'height: ' + predictions[n].bbox[3] + 'px;';

      event.target.parentNode.appendChild(highlighter);
      event.target.parentNode.appendChild(p);
    }
  });
}



/********************************************************************
// Demo 2: Continuously grab image from webcam stream and classify it.
// Note: You must access the demo on https for this to work:
// https://tensorflow-js-image-classification.glitch.me/
********************************************************************/

const video = document.getElementById('webcam');
const liveView = document.getElementById('liveView');

// Check if webcam access is supported.
function hasGetUserMedia() {
  return !!(navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia);
}

// Keep a reference of all the child elements we create
// so we can remove them easilly on each render.
var children = [];


// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
  const enableWebcamButton = document.getElementById('webcamButton');
  enableWebcamButton.addEventListener('click', enableCam);
} else {
  console.warn('getUserMedia() is not supported by your browser');
}


// Enable the live webcam view and start classification.
function enableCam(event) {
  if (!model) {
    console.log('Wait! Model not loaded yet.')
    return;
  }
  
  // Hide the button.
  event.target.classList.add('removed');  
  
  // getUsermedia parameters.
  const constraints = {
    video: true
  };
  constraints.video.facingMode = "environment";
  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
    video.srcObject = stream;
    video.addEventListener('loadeddata', predictWebcam);
  });
}


function predictWebcam() {
  // Now let's start classifying the stream.
  model.detect(video).then(function (predictions) {
    // Remove any highlighting we did previous frame.
    for (let i = 0; i < children.length; i++) {
      liveView.removeChild(children[i]);
    }
    children.splice(0);
    
    // Now lets loop through predictions and draw them to the live view if
    // they have a high confidence score.
    for (let n = 0; n < predictions.length; n++) {
      // If we are over 66% sure we are sure we classified it right, draw it!
      if (predictions[n].score > 0.66) {
        const p = document.createElement('p');
        p.innerText = predictions[n].class  + ' - with ' 
            + Math.round(parseFloat(predictions[n].score) * 100) 
            + '% confidence.';
        // Draw in top left of bounding box outline.
        p.style = 'left: ' + predictions[n].bbox[0] + 'px;' +
            'top: ' + predictions[n].bbox[1] + 'px;' + 
            'width: ' + (predictions[n].bbox[2] - 10) + 'px;';

        // Draw the actual bounding box.
        const highlighter = document.createElement('div');
        highlighter.setAttribute('class', 'highlighter');
        highlighter.style = 'left: ' + predictions[n].bbox[0] + 'px; top: '
            + predictions[n].bbox[1] + 'px; width: ' 
            + predictions[n].bbox[2] + 'px; height: '
            + predictions[n].bbox[3] + 'px;';

        liveView.appendChild(highlighter);
        liveView.appendChild(p);
        
        // Store drawn objects in memory so we can delete them next time around.
        children.push(highlighter);
        children.push(p);
      }
    }
    
    // Call this function again to keep predicting when the browser is ready.
    window.requestAnimationFrame(predictWebcam);
  });
}


// (function () {
//   if (
//     !"mediaDevices" in navigator ||
//     !"getUserMedia" in navigator.mediaDevices
//   ) {
//     alert("Camera API is not available in your browser");
//     return;
//   }

//  alert('The beginning');
  
//   const threshold = 0.75;


//   async function load_model() {
//     // It's possible to load the model locally or from a repo
//     // You can choose whatever IP and PORT you want in the "http://127.0.0.1:8080/model.json" just set it before in your https server
// //     const model = await loadGraphModel("http://192.168.1.35:1883/getmodel/model.json");
//     const model = await loadGraphModel("https://raw.githubusercontent.com/hugozanini/TFJS-object-detection/master/models/kangaroo-detector/model.json");
//     return model;
//   }


//   let classesDir = {
//     1: {
//         name: 'Recipe1',
//         id: 1,
//     },
//     2: {
//         name: 'Other',
//         id: 2,
//     }

//   }
  
//   alert('classesDir');
//   alert(classesDir[1].name);

// //    const model = load_model();
//   const model = await loadGraphModel("https://raw.githubusercontent.com/hugozanini/TFJS-object-detection/master/models/kangaroo-detector/model.json");
//   alert('after load_model C2');
  
//     model.then(model => {
//     if (model instanceof tf.GraphModel) {
//       console.log('Model successfully loaded!');
//         alert('Model successfully loaded!');
//       // Do something with the loaded model
//     } else {
//       console.error('Failed to load model!');
//       alert('Model NOT loaded!3');
//     }
//   }).catch(error => {
//     console.error('Error loading model:', error);
//       alert('Model NOT loaded!4');
//   });

  
  
//   // get page elements
//   const video = document.querySelector("#video");
//   const btnPlay = document.querySelector("#btnPlay");
//   const btnPause = document.querySelector("#btnPause");
//   const btnScreenshot = document.querySelector("#btnScreenshot");
//   const btnChangeCamera = document.querySelector("#btnChangeCamera");
//   const screenshotsContainer = document.querySelector("#screenshots");
//   const canvas = document.querySelector("#canvas");
//   const devicesSelect = document.querySelector("#devicesSelect");

//   const MODEL_INPUT_HEIGHT = 224;
//   const MODEL_INPUT_WIDTH = 224;
//   const SCORE_THRESHOLD = 0.5;

//   // video constraints
//   const constraints = {
//     video: {
//       width: {
//         min: 1280,
//         ideal: 1920,
//         max: 2560,
//       },
//       height: {
//         min: 720,
//         ideal: 1080,
//         max: 1440,
//       },
//     },
//   };

//   // use front face camera
//   let useFrontCamera = true;

//   // current video stream
//   let videoStream;

//   // handle events
//   // play
//   btnPlay.addEventListener("click", function () {
//     video.play();
//     btnPlay.classList.add("is-hidden");
//     btnPause.classList.remove("is-hidden");
//   });

//   // pause
//   btnPause.addEventListener("click", function () {
//     video.pause();
//     btnPause.classList.add("is-hidden");
//     btnPlay.classList.remove("is-hidden");
//   });

//   // take screenshot
//   btnScreenshot.addEventListener("click", function () {
//     const img = document.createElement("img");
//     canvas.width = video.videoWidth;
//     canvas.height = video.videoHeight;
//     canvas.getContext("2d").drawImage(video, 0, 0);
//     img.src = canvas.toDataURL("image/png");
//     screenshotsContainer.prepend(img);
//   });

//   // switch camera
//   btnChangeCamera.addEventListener("click", function () {
//     useFrontCamera = !useFrontCamera;

//     initializeCamera();
//   });

//   // stop video stream
//   function stopVideoStream() {
//     if (videoStream) {
//       videoStream.getTracks().forEach((track) => {
//         track.stop();
//       });
//     }
//   }

//   // initialize
//   async function initializeCamera() {
//     alert('at initializeCamera function');
//     stopVideoStream();
//     constraints.video.facingMode = useFrontCamera ? "user" : "environment";

//     try {
//       videoStream = await navigator.mediaDevices.getUserMedia(constraints);
//       video.srcObject = videoStream;
//       alert('videoStream at video.srcObject');
      
//          //const canvas = document.getElementById('canvas');
//         canvas.width = video.videoWidth;
//         canvas.height = video.videoHeight;
//         const ctx = canvas.getContext('2d');

//         function detectFrame() {
//           alert('inside detectframe1');
//           ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
//           alert('inside detectframe2');
//           const input = tf.browser.fromPixels(canvas);
//           alert('inside detectframe3');
//           const preprocessed = preprocess(input);
//           alert('inside detectframe4');
//           const predictions = model.execute(preprocessed);
//           alert('inside detectframe5');
//           alert(predictions);
//           const boxes = predictions[0].arraySync();
//           alert('inside detectframe6');
//           const classes = predictions[1].arraySync();
//           alert('inside detectframe7');
//           const scores = predictions[2].arraySync();
//           alert('inside detectframe8');
//           postprocess(boxes, classes, scores);
//           alert('inside detectframe9');
//           requestAnimationFrame(detectFrame);
//           alert('inside detectframe10');
//         }

//         function preprocess(input) {
//           //const resized = tf.image.resizeBilinear(input, [MODEL_INPUT_HEIGHT, MODEL_INPUT_WIDTH]);
//           const resized = tf.image.resizeBilinear(input, [canvas.height, canvas.width]);
//           const normalized = resized.toFloat().div(127.5).sub(1);
//           const expanded = normalized.expandDims();
//           return expanded;
//         }

//         function postprocess(boxes, classes, scores) {
//           for (let i = 0; i < boxes.length; i++) {
//             if (scores[i] > SCORE_THRESHOLD) {
//               const ymin = boxes[i][0] * canvas.height;
//               const xmin = boxes[i][1] * canvas.width;
//               const ymax = boxes[i][2] * canvas.height;
//               const xmax = boxes[i][3] * canvas.width;
//               const ctx = canvas.getContext('2d');
//               ctx.beginPath();
//               ctx.lineWidth = '2';
//               ctx.strokeStyle = 'red';
//               ctx.rect(xmin, ymin, xmax - xmin, ymax - ymin);
//               ctx.stroke();
//             }
//           }
//         }
      
//       requestAnimationFrame(detectFrame);
      
      
//     } catch (err) {
//       alert("Could not access the camera");
//     }
//   }

//   initializeCamera();
// })();

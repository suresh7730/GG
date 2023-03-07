(function () {
  if (
    !"mediaDevices" in navigator ||
    !"getUserMedia" in navigator.mediaDevices
  ) {
    alert("Camera API is not available in your browser");
    return;
  }

 alert('The beginning');
  
  const threshold = 0.75;


  async function load_model() {
    // It's possible to load the model locally or from a repo
    // You can choose whatever IP and PORT you want in the "http://127.0.0.1:8080/model.json" just set it before in your https server
//     const model = await loadGraphModel("http://192.168.1.35:1883/getmodel/model.json");
    const model = await loadGraphModel("https://raw.githubusercontent.com/hugozanini/TFJS-object-detection/master/models/kangaroo-detector/model.json");
    return model;
  }


  let classesDir = {
    1: {
        name: 'Recipe1',
        id: 1,
    },
    2: {
        name: 'Other',
        id: 2,
    }

  }
  
  alert('classesDir');
  alert(classesDir[1].name);

   const model = load_model();
//   const model = await loadGraphModel("https://raw.githubusercontent.com/hugozanini/TFJS-object-detection/master/models/kangaroo-detector/model.json");
  alert('after load_model C2');
  
    model.then(model => {
    if (model instanceof tf.GraphModel) {
      console.log('Model successfully loaded!');
        alert('Model successfully loaded!');
      // Do something with the loaded model
    } else {
      console.error('Failed to load model!');
      alert('Model NOT loaded!1');
    }
  }).catch(error => {
    console.error('Error loading model:', error);
      alert('Model NOT loaded!2');
  });

  
  
  // get page elements
  const video = document.querySelector("#video");
  const btnPlay = document.querySelector("#btnPlay");
  const btnPause = document.querySelector("#btnPause");
  const btnScreenshot = document.querySelector("#btnScreenshot");
  const btnChangeCamera = document.querySelector("#btnChangeCamera");
  const screenshotsContainer = document.querySelector("#screenshots");
  const canvas = document.querySelector("#canvas");
  const devicesSelect = document.querySelector("#devicesSelect");

  const MODEL_INPUT_HEIGHT = 224;
  const MODEL_INPUT_WIDTH = 224;
  const SCORE_THRESHOLD = 0.5;

  // video constraints
  const constraints = {
    video: {
      width: {
        min: 1280,
        ideal: 1920,
        max: 2560,
      },
      height: {
        min: 720,
        ideal: 1080,
        max: 1440,
      },
    },
  };

  // use front face camera
  let useFrontCamera = true;

  // current video stream
  let videoStream;

  // handle events
  // play
  btnPlay.addEventListener("click", function () {
    video.play();
    btnPlay.classList.add("is-hidden");
    btnPause.classList.remove("is-hidden");
  });

  // pause
  btnPause.addEventListener("click", function () {
    video.pause();
    btnPause.classList.add("is-hidden");
    btnPlay.classList.remove("is-hidden");
  });

  // take screenshot
  btnScreenshot.addEventListener("click", function () {
    const img = document.createElement("img");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    img.src = canvas.toDataURL("image/png");
    screenshotsContainer.prepend(img);
  });

  // switch camera
  btnChangeCamera.addEventListener("click", function () {
    useFrontCamera = !useFrontCamera;

    initializeCamera();
  });

  // stop video stream
  function stopVideoStream() {
    if (videoStream) {
      videoStream.getTracks().forEach((track) => {
        track.stop();
      });
    }
  }

  // initialize
  async function initializeCamera() {
    alert('at initializeCamera function');
    stopVideoStream();
    constraints.video.facingMode = useFrontCamera ? "user" : "environment";

    try {
      videoStream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = videoStream;
      alert('videoStream at video.srcObject');
      
         //const canvas = document.getElementById('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');

        function detectFrame() {
          alert('inside detectframe1');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          alert('inside detectframe2');
          const input = tf.browser.fromPixels(canvas);
          alert('inside detectframe3');
          const preprocessed = preprocess(input);
          alert('inside detectframe4');
          const predictions = model.execute(preprocessed);
          alert('inside detectframe5');
          alert(predictions);
          const boxes = predictions[0].arraySync();
          alert('inside detectframe6');
          const classes = predictions[1].arraySync();
          alert('inside detectframe7');
          const scores = predictions[2].arraySync();
          alert('inside detectframe8');
          postprocess(boxes, classes, scores);
          alert('inside detectframe9');
          requestAnimationFrame(detectFrame);
          alert('inside detectframe10');
        }

        function preprocess(input) {
          //const resized = tf.image.resizeBilinear(input, [MODEL_INPUT_HEIGHT, MODEL_INPUT_WIDTH]);
          const resized = tf.image.resizeBilinear(input, [canvas.height, canvas.width]);
          const normalized = resized.toFloat().div(127.5).sub(1);
          const expanded = normalized.expandDims();
          return expanded;
        }

        function postprocess(boxes, classes, scores) {
          for (let i = 0; i < boxes.length; i++) {
            if (scores[i] > SCORE_THRESHOLD) {
              const ymin = boxes[i][0] * canvas.height;
              const xmin = boxes[i][1] * canvas.width;
              const ymax = boxes[i][2] * canvas.height;
              const xmax = boxes[i][3] * canvas.width;
              const ctx = canvas.getContext('2d');
              ctx.beginPath();
              ctx.lineWidth = '2';
              ctx.strokeStyle = 'red';
              ctx.rect(xmin, ymin, xmax - xmin, ymax - ymin);
              ctx.stroke();
            }
          }
        }
      
      requestAnimationFrame(detectFrame);
      
      
    } catch (err) {
      alert("Could not access the camera");
    }
  }

  initializeCamera();
})();

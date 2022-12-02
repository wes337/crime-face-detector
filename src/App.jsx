import { createSignal, onMount, Show, For } from "solid-js";
import * as tmImage from "@teachablemachine/image";
import ml5 from "ml5";
import styles from "./App.module.css";
import Scanner from "./Scanner";

const URL = "https://teachablemachine.withgoogle.com/models/4sZyLhsE9/";

function App() {
  let video;

  const [model, setModel] = createSignal();
  const [faceDetected, setFaceDetected] = createSignal(false);
  const [analyzing, setAnalyzing] = createSignal(false);
  const [loading, setLoading] = createSignal(false);
  const [crime, setCrime] = createSignal("");
  const [tries, setTries] = createSignal(0);
  const [crimes, setCrimes] = createSignal([]);
  const [secondaryCrimes, setSecondaryCrimes] = createSignal([]);

  const setupWebcam = async () => {
    video.setAttribute("autoplay", "");
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");

    const constraints = {
      audio: false,
      video: {
        facingMode: "user",
      },
    };

    const localMediaStream = await navigator.mediaDevices.getUserMedia(
      constraints
    );

    if ("srcObject" in video) {
      video.srcObject = localMediaStream;
    } else {
      video.src = URL.createObjectURL(localMediaStream);
    }

    await video.play();
  };

  const setupMl = async () => {
    const modelUrl = URL + "model.json";
    const metadataUrl = URL + "metadata.json";
    const model = await tmImage.load(modelUrl, metadataUrl);
    setModel(model);
  };

  onMount(async () => {
    setLoading(true);
    setTimeout(async () => {
      await setupWebcam();
      await detectFaces();
      await setupMl();
      setLoading(false);
    }, 0);
  });

  const detectFaces = async () => {
    const facemesh = await ml5.facemesh(video);

    facemesh.on("face", (results) => {
      setFaceDetected(results.length > 0);
    });
  };

  const analyze = async () => {
    const predictions = await model().predict(video);

    const sortedPredictions = predictions
      .map((p) => ({
        name: p.className,
        probability: p.probability.toFixed(2),
      }))
      .filter((p) => p.probability > 0)
      .sort((a, b) => Number(b.probability) - Number(a.probability));

    setCrimes([...crimes(), sortedPredictions[0].name]);

    setTries(tries() + 1);

    if (tries() < 30) {
      analyze();
    } else {
      const counts = {};

      crimes().forEach((crime) => {
        counts[crime] = (counts[crime] || 0) + 1;
      });

      const arr = Object.keys(counts);
      arr.sort((a, b) => Number(counts[b]) - Number(counts[a]));

      setCrime(arr[0]);
      setSecondaryCrimes(arr.slice(1, 3));
      setAnalyzing(false);
    }
  };

  const onClick = async () => {
    setAnalyzing(true);

    setTimeout(async () => {
      await analyze();
    }, 1000);
  };

  const reset = () => {
    setCrime("");
    setSecondaryCrimes([]);
    setTries(0);
  };

  return (
    <div class={styles.app}>
      <Show when={loading()}>
        <div class={styles.loading}>Loading...</div>
      </Show>
      <Show when={!faceDetected() && !loading()}>
        <div class={styles.loading}>No Face Detected</div>
      </Show>
      <Show when={faceDetected() && analyzing()}>
        <Scanner />
        <div class={styles.analyzing}>Analyzing...</div>
      </Show>
      <Show when={faceDetected() && crime() && !analyzing()}>
        <div class={styles.crime}>
          <span>Most likely to commit:</span>
          <h1>{crime()}</h1>
          <For each={secondaryCrimes()}>
            {(secondaryCrime) => <h2>{secondaryCrime}</h2>}
          </For>
        </div>
      </Show>
      <div class={styles.camera}>
        <video ref={video} muted autoplay playsinline />
      </div>
      <Show
        when={faceDetected() && crime() && !analyzing()}
        fallback={
          <button
            class={styles.analyze}
            onClick={onClick}
            disabled={analyzing() || loading() || !faceDetected()}
          >
            Analyze Face For Crime
          </button>
        }
      >
        <button class={styles.reset} onClick={reset}>
          Reset
        </button>
      </Show>
    </div>
  );
}

export default App;

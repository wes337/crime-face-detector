import { createSignal, onMount, Show, For } from "solid-js";
import ml5 from "ml5";
import { getSecondaryCrimes, getTopCrime } from "./functions";
import styles from "./App.module.css";

function App() {
  let video;
  const knnClassifier = ml5.KNNClassifier();
  const [featureExtractor, setFeatureExtractor] = createSignal();
  const [analyzing, setAnalyzing] = createSignal(false);
  const [loading, setLoading] = createSignal(false);
  const [crime, setCrime] = createSignal("");
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
    const featureExtractor = await ml5.featureExtractor("MobileNet");
    setFeatureExtractor(featureExtractor);
    await knnClassifier.load("./assets/knn.json");
  };

  onMount(async () => {
    setLoading(true);
    await setupWebcam();
    await setupMl();
    setLoading(false);
  });

  const analyze = async () => {
    setAnalyzing(true);
    const features = featureExtractor().infer(video);
    const results = await knnClassifier.classify(features);

    const crime = getTopCrime(results);
    setCrime(crime);
    const secondaryCrimes = getSecondaryCrimes(results);
    setSecondaryCrimes(secondaryCrimes);

    setAnalyzing(false);
  };

  return (
    <div class={styles.app}>
      <Show when={loading()}>
        <div class={styles.loading}>Loading</div>
      </Show>
      <Show when={analyzing()}>
        <div class={styles.analyzing}>Analyzing...</div>
      </Show>
      <Show when={crime()}>
        <div class={styles.crime}>
          <h1>{crime()}</h1>
          <For each={secondaryCrimes()}>
            {(secondaryCrime) => <h2>{secondaryCrime}</h2>}
          </For>
        </div>
      </Show>
      <div class={styles.camera}>
        <video ref={video} muted autoplay playsinline />
      </div>
      <button
        class={styles.analyze}
        onClick={analyze}
        disabled={analyzing() || loading()}
      >
        Analyze
      </button>
    </div>
  );
}

export default App;

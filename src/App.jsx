import { createSignal, onMount, Show, For } from "solid-js";
import * as tmImage from "@teachablemachine/image";
import styles from "./App.module.css";

const URL = "https://teachablemachine.withgoogle.com/models/4sZyLhsE9/";

function App() {
  let video;

  const [model, setModel] = createSignal();
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
    const modelUrl = URL + "model.json";
    const metadataUrl = URL + "metadata.json";
    const model = await tmImage.load(modelUrl, metadataUrl);
    setModel(model);
  };

  onMount(async () => {
    setLoading(true);
    await setupWebcam();
    await setupMl();
    setLoading(false);
  });

  const analyze = async () => {
    const predictions = await model().predict(video);

    const sortedPredictions = predictions
      .map((p) => ({
        name: p.className,
        probability: p.probability.toFixed(2),
      }))
      .filter((p) => p.probability > 0)
      .sort((a, b) => Number(b.probability) - Number(a.probability));

    setCrime(sortedPredictions[0].name);
    setSecondaryCrimes(sortedPredictions.slice(1, 3).map((p) => p.name));
  };

  const onClick = async () => {
    setAnalyzing(true);

    setTimeout(async () => {
      await analyze();
      setAnalyzing(false);
    }, 0);
  };

  return (
    <div class={styles.app}>
      <Show when={loading()}>
        <div class={styles.loading}>Loading</div>
      </Show>

      {analyzing() && <div class={styles.analyzing}>Analyzing...</div>}

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
        onClick={onClick}
        disabled={analyzing() || loading()}
      >
        Analyze
      </button>
    </div>
  );
}

export default App;

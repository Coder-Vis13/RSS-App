import Lottie from "lottie-react";
import articlesAnim from "../assets/articles.json"; // path to your file
import { useEffect, useRef } from "react";

// export function ArticlesAnimation() {
//   return <Lottie animationData={articlesAnim} loop autoplay style={{ height: 250 }} />;
// }

export function ArticlesAnimation() {
  const lottieRef = useRef();

  useEffect(() => {
    // Skip first 3 seconds (~90 frames if 30fps)
    lottieRef.current.goToAndPlay(90, true);
  }, []);

  return (
    <Lottie
      lottieRef={lottieRef}
      animationData={articlesAnim}
      loop
      autoplay={false} // we control start manually
      style={{ height: 250 }}
    />
  );
}

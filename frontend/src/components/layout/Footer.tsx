import { ArrowIcon, GithubIcon, LensMark } from '../ui/Icons'
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-invite">
          <span className="eyebrow">CURIOSITY IS THE STARTING POINT.</span>
          <h2>Look a little closer.</h2>
          <a href="#explorer" className="button button-primary">
            Explore the data <ArrowIcon />
          </a>
        </div>
        <div className="footer-bottom">
          <a href="#home" className="wordmark">
            <LensMark />
            <span>SENTINEL.</span>
          </a>
          <p>An open exploration of network behavior.</p>
          <a
            href="https://github.com/Rajchetan16/SENTINEL"
            target="_blank"
            rel="noreferrer"
            className="github-link"
          >
            <GithubIcon /> View source <ArrowIcon className="arrow-diagonal" />
          </a>
          <a href="#home" className="back-top" aria-label="Back to top">
            ↑
          </a>
        </div>
      </div>
    </footer>
  )
}

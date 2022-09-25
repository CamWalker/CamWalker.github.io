import { observer } from 'mobx-react-lite';
import Board from './components/Board';
import './App.css';

function App({ store }) {
  function appHeight() {
    const doc = document.documentElement
    doc.style.setProperty('--vh', (window.innerHeight*.01) + 'px');
  }
  
  window.addEventListener('resize', appHeight);
  appHeight();

  return (
    <div className="App">
      <Board store={store} />
    </div>
  );
}

export default observer(App);

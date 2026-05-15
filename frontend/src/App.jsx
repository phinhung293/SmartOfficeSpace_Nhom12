import React from 'react';
import Header from './components/Header';
import Footer from './components/Footer';

function App() {
  return (
    <>
      <Header />
      
      {/* Đây sẽ là nơi sau này bạn gắn React Router để render các trang như HomePage, BookingPage... */}
      <main className="main-content">
          <div style={{ padding: '100px', textAlign: 'center', minHeight: '500px' }}>
              <h2>Nội dung các trang sẽ nằm ở đây</h2>
          </div>
      </main>

      <Footer />
    </>
  );
}

export default App;
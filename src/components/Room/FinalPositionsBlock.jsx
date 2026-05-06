import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../../Contexts/UserContext.jsx';
import styles from './styles/FinalPositionsBlock.module.css';

function FinalPositionsBlock() {
  const [finalPositions, setFinalPositions] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const { userCurrentStatus } = useContext(UserContext);

  useEffect(() => {
    const stored = localStorage.getItem('finalPositions');
    if (stored) {
      const parsed = JSON.parse(stored);
      setFinalPositions(parsed);
      localStorage.removeItem('finalPositions');
    }
  }, []);

  if (!finalPositions || !isVisible) {
    return null;
  }

  const handleClose = () => setIsVisible(false);

  const sortedPlayers = Object.values(finalPositions).sort(
    (a, b) => a.position - b.position,
  );

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>Final Positions</h2>
        <table className={styles.table}>
          <thead>
          <tr>
            <th>Name</th>
            <th>Position</th>
          </tr>
          </thead>
          <tbody>
          {sortedPlayers.map((player, index) => (
            <tr
              key={index}
              className={player.bot ? styles.botRow : ''}
            >
              <td>{player.name}</td>
              <td>{player.position}</td>
            </tr>
          ))}
          </tbody>
        </table>
        <button className={styles.closeButton} onClick={handleClose}>
          Close
        </button>
      </div>
    </div>
  );
}

export default FinalPositionsBlock;
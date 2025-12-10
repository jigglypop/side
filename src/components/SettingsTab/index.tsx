import { type FC } from 'react';
import styles from './SettingsTab.module.css';
import type { SettingsTabProps } from './types'
import ModelSelector from '../ModelSelector';
import { useSettings } from '../../hooks/useSettings';

export const SettingsTab: FC<SettingsTabProps> = () => {
 const { settings, saveSettings } = useSettings();
 const handleSave = () => {
  // 현재 settingsAtom에 담겨있는 값을 그대로 저장 (모델/키는 각 컴포넌트에서 갱신됨)
  saveSettings({ ...settings });
 };
 return (
  <div className={styles.container}>
   <div className={styles.header}>
    <h2>설정</h2>
    <div>
     <button className={styles.button} onClick={() => location.reload()}>취소</button>
     <button className={`${styles.button} ${styles.buttonPrimary}`} onClick={handleSave}>저장</button>
    </div>
   </div>
   <div className={styles.body}>
    <ModelSelector />
   </div>
   <div className={styles.footer}>
    <button className={styles.button} onClick={() => location.reload()}>취소</button>
    <button className={`${styles.button} ${styles.buttonPrimary}`} onClick={handleSave}>저장</button>
   </div>
  </div>
 )
}

export default SettingsTab; 
import { type FC } from 'react';
import { useAtom } from 'jotai';
import { aiModelsAtom, selectedModelAtom } from '../../atoms/settingsAtoms';
import styles from './ModelSelector.module.css';

export const ModelSelector: FC = () => {
  const [models, setModels] = useAtom(aiModelsAtom);
  const [selectedModel, setSelectedModel] = useAtom(selectedModelAtom);

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
  };

  const handleApiKeyChange = (modelId: string, apiKey: string) => {
    setModels(models.map(model => 
      model.id === modelId ? { ...model, apiKey } : model
    ));
  };

  return (
    <div className={styles.container}>
      <div className={styles.modelList}>
        {models
          .sort((a, b) => a.order - b.order)
          .map(model => (
            <label
              key={model.id}
              className={`${styles.modelCard} ${selectedModel === model.id ? styles.selected : ''}`}
            >
              <div className={styles.radioWrapper}>
                <input
                  type="radio"
                  name="model"
                  checked={selectedModel === model.id}
                  onChange={() => handleSelectModel(model.id)}
                  className={styles.radio}
                />
              </div>
              
              <div className={styles.modelInfo}>
                <div className={styles.modelDetails}>
                  <span className={styles.modelName}>{model.name}</span>
                  <span className={styles.modelId}>{model.model}</span>
                </div>
              </div>
            </label>
          ))}
      </div>

      <div className={styles.apiKeySection}>
        <label className={styles.label}>
          API Key
          <input
            type="password"
            value={models.find(m => m.id === selectedModel)?.apiKey || ''}
            onChange={(e) => handleApiKeyChange(selectedModel, e.target.value)}
            placeholder="API Key를 입력하세요"
            className={styles.input}
          />
        </label>
        <p className={styles.hint}>
          선택한 모델의 API Key를 입력하세요
        </p>
      </div>
    </div>
  );
};

export default ModelSelector;


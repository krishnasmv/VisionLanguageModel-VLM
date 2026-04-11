'use client';
import { useState } from 'react';

export default function Home() {
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [task, setTask] = useState('caption');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImage(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!image) {
    setError('Please upload an image');
    return;
  }

  setLoading(true);
  setError('');
  setResult('');

  try {
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result.split(',')[1];
      console.log('Sending request...');

      const res = await fetch('/api/clip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: base64, task }),
      });

      console.log('Response status:', res.status);
      const data = await res.json();
      console.log('Response data:', data);

      if (!res.ok) {
        throw new Error(data.error || 'API error');
      }

      const output = data.output?.[0] || data.output || JSON.stringify(data);
      console.log('Output:', output);
      setResult(output);
    };
    reader.readAsDataURL(image);
  } catch (err) {
    console.error('Error:', err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={{ maxWidth: '700px', margin: '50px auto', fontFamily: 'sans-serif', padding: '20px' }}>
      <h1>Qwen2.5-VL: Image Caption & Summarizer</h1>
      <p style={{ color: '#666' }}>Upload an image and get captions or summaries</p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Upload Image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{
              width: '100%',
              padding: '10px',
              border: '2px solid #ddd',
              borderRadius: '4px',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {imagePreview && (
          <div style={{ marginBottom: '20px' }}>
            <img
              src={imagePreview}
              alt="Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '300px',
                borderRadius: '4px',
                border: '1px solid #ddd',
              }}
            />
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
            Select Task
          </label>
          <div style={{ display: 'flex', gap: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="radio"
                name="task"
                value="caption"
                checked={task === 'caption'}
                onChange={(e) => setTask(e.target.value)}
              />
              Generate Caption
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="radio"
                name="task"
                value="summary"
                checked={task === 'summary'}
                onChange={(e) => setTask(e.target.value)}
              />
              Generate Summary
            </label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !image}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: loading || !image ? '#ccc' : '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading || !image ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
          }}
        >
          {loading ? 'Processing... (this may take 30 seconds)' : task === 'caption' ? 'Generate Caption' : 'Generate Summary'}
        </button>
      </form>

      {error && (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fee', borderRadius: '4px', color: '#c00' }}>
          Error: {error}
        </div>
      )}

      {result && (
        <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#efe', borderRadius: '4px' }}>
          <h2 style={{ marginTop: 0 }}>
            {task === 'caption' ? 'Caption' : 'Summary'}
          </h2>
          <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#333' }}>
            {result}
          </p>
        </div>
      )}
    </div>
  );
}

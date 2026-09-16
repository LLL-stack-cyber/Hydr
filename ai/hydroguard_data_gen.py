import pandas as pd
import numpy as np
from datetime import datetime, timedelta

print("Initializing Synthetic Environment...")

# Create synthetic dataset from scratch
np.random.seed(42)
n_rows = 1200 # 400 Normal, 400 Warning, 400 Abnormal

# Base timestamps
start_time = datetime(2026, 8, 1, 0, 0, 0)
timestamps = [start_time + timedelta(minutes=15*i) for i in range(n_rows)]

# Randomize the AI states
conditions = ['NORMAL'] * 400 + ['WARNING'] * 400 + ['ABNORMAL'] * 400
np.random.shuffle(conditions)

data = {
    'timestamp': timestamps,
    'filter_condition': conditions
}
df = pd.DataFrame(data)

print("Simulating sensor physics and environmental data...")
# Generate Base environmental and physical features
df['pH'] = np.random.uniform(6.5, 8.0, n_rows).round(2)
df['tds'] = np.random.uniform(200, 600, n_rows).round(1)
df['temperature'] = np.random.uniform(22.0, 30.0, n_rows).round(2)
df['air_temp'] = np.random.uniform(25.0, 35.0, n_rows).round(2)
df['air_humidity'] = np.random.uniform(40.0, 80.0, n_rows).round(1)
df['raw_tank_level'] = np.random.uniform(10.0, 90.0, n_rows).round(1)
df['clean_tank_level'] = np.random.uniform(10.0, 90.0, n_rows).round(1)
df['flow_in'] = np.random.uniform(0.35, 0.50, n_rows).round(3)
df['pump_state'] = 1

# ==========================================
# 🧠 AI LOGIC CORRELATIONS
# ==========================================
turb_cond = [
    df['filter_condition'] == 'NORMAL',
    df['filter_condition'] == 'WARNING',
    df['filter_condition'] == 'ABNORMAL'
]

# 1. Turbidity Logic (Gets cloudier as filter fails)
turb_vals = [
    np.random.uniform(1.0, 10.0, n_rows),
    np.random.uniform(10.0, 40.0, n_rows),
    np.random.uniform(40.0, 150.0, n_rows)
]
df['turbidity'] = np.select(turb_cond, turb_vals).round(2)

# 2. Flow Out Logic (Massive pressure drop when clogged)
flow_out_mult = [
    np.random.uniform(0.90, 0.98, n_rows), # Normal: 90-98% flow
    np.random.uniform(0.60, 0.85, n_rows), # Warning: 60-85% flow
    np.random.uniform(0.05, 0.30, n_rows)  # Clogged: 5-30% flow
]
df['flow_out'] = (df['flow_in'] * np.select(turb_cond, flow_out_mult)).round(3)

# 3. Bypass Logic (Triggered ONLY when Abnormal/Clogged)
bypass_vals = [0, 0, 1]
df['bypass_state'] = np.select(turb_cond, bypass_vals)

# Reorder columns to perfectly match the ESP32 JSON payload
cols = ['timestamp', 'pH', 'turbidity', 'tds', 'temperature', 'air_temp', 'air_humidity', 
        'flow_in', 'flow_out', 'raw_tank_level', 'clean_tank_level', 
        'pump_state', 'bypass_state', 'filter_condition']
df = df[cols]

# Save to CSV
filename = 'HydroGuard_Matched_Training_Data.csv'
df.to_csv(filename, index=False)
print(f"Dataset successfully compiled and saved as: {filename}")

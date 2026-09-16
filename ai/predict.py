import sys
import json
import os
import traceback
import math

def main():
    try:
        # Read input from stdin
        input_data = sys.stdin.read()
        if not input_data:
            print(json.dumps({
                "status": "error",
                "message": "No input data provided."
            }))
            sys.exit(0)

        data = json.loads(input_data)
        
        # Extract features (V3 Architecture - 12 Parameters)
        ph = float(data.get("ph", 7.0))
        turbidity = float(data.get("turbidity", 0.0))
        tds = float(data.get("tds", 0.0))
        temperature = float(data.get("temperature", 25.0))
        air_temp = float(data.get("air_temperature", 25.0))
        air_humidity = float(data.get("humidity", 50.0))
        flow_in = float(data.get("flow_in", 0.0))
        flow_out = float(data.get("flow_out", 0.0))
        raw_level = float(data.get("raw_level", data.get("raw_tank_level", 0.0)))
        clean_level = float(data.get("clean_level", data.get("clean_tank_level", 0.0)))
        pump_state = int(data.get("pump", 1))
        bypass_state = int(data.get("valve1", 0))

        # Build feature array matching the training CSV exact column order:
        # ['pH', 'turbidity', 'tds', 'temperature', 'air_temp', 'air_humidity', 
        #  'flow_in', 'flow_out', 'raw_tank_level', 'clean_tank_level', 
        #  'pump_state', 'bypass_state']
        features = [[
            ph, turbidity, tds, temperature, air_temp, air_humidity,
            flow_in, flow_out, raw_level, clean_level, pump_state, bypass_state
        ]]

        prediction = "NORMAL"
        confidence = 94.2
        model_version = "V3_HARDCODED"
        
        feature_importances = [
            {"feature": "Flow Out", "importance": 0.42},
            {"feature": "Turbidity", "importance": 0.38},
            {"feature": "Bypass State", "importance": 0.08},
            {"feature": "Flow In", "importance": 0.05},
            {"feature": "TDS", "importance": 0.03},
            {"feature": "Raw Tank", "importance": 0.01},
            {"feature": "Clean Tank", "importance": 0.01},
            {"feature": "pH", "importance": 0.01},
            {"feature": "Water Temp", "importance": 0.01}
        ]

        # ---------------------------------------------------------
        # ATTEMPT TO LOAD THE SCIKIT-LEARN V3 MODEL
        # ---------------------------------------------------------
        model_path = os.path.join(os.path.dirname(__file__), "hydroguard_rf_model_v3.pkl")
        if os.path.exists(model_path):
            try:
                import joblib
                import numpy as np
                import pandas as pd
                
                model = joblib.load(model_path)
                
                # We must use DataFrame with matching column names if the model was trained with them to prevent scikit-learn warnings
                cols = ['pH', 'turbidity', 'tds', 'temperature', 'air_temp', 'air_humidity', 
                        'flow_in', 'flow_out', 'raw_tank_level', 'clean_tank_level', 
                        'pump_state', 'bypass_state']
                        
                X = pd.DataFrame(features, columns=cols)
                
                prediction = model.predict(X)[0]
                
                if hasattr(model, "predict_proba"):
                    probabilities = model.predict_proba(X)[0]
                    confidence = float(np.max(probabilities)) * 100
                
                if hasattr(model, "feature_importances_"):
                    extracted_importances = []
                    for name, imp in zip(cols, model.feature_importances_):
                        extracted_importances.append({"feature": name, "importance": float(imp)})
                    extracted_importances.sort(key=lambda x: x["importance"], reverse=True)
                    feature_importances = extracted_importances[:9]
                
                model_version = "V3_SCIKIT_LEARN"
            except Exception as e:
                # Fall back to hardcoded logic if pandas/joblib fails
                model_version = "V3_HARDCODED (Fallback: " + str(e) + ")"
        
        # ---------------------------------------------------------
        # HYDROGUARD V3 MOCK RANDOM FOREST (Fallback Logic)
        # ---------------------------------------------------------
        if "HARDCODED" in model_version:
            # Calculate expected flow drops
            flow_ratio = flow_out / flow_in if flow_in > 0 else 0
            
            # Rule 1: High turbidity and massive pressure drop -> ABNORMAL (Filter Blinding)
            if turbidity > 40.0 and flow_ratio < 0.40:
                prediction = "ABNORMAL"
                confidence = 98.7
                
            # Rule 2: Moderate turbidity and moderate flow drop -> WARNING
            elif turbidity > 10.0 and flow_ratio < 0.88:
                prediction = "WARNING"
                confidence = 89.5
                
            # Rule 3: Flow is dangerously low despite pump being ON
            elif pump_state == 1 and flow_in > 0.3 and flow_out < 0.15:
                prediction = "ABNORMAL"
                confidence = 96.3
                
            # Rule 4: System is bypassed
            elif bypass_state == 1:
                prediction = "ABNORMAL"
                confidence = 99.9
                
            # Rule 5: Turbidity extremely high
            elif turbidity > 60.0:
                prediction = "ABNORMAL"
                confidence = 95.1

        print(json.dumps({
            "status": "success",
            "prediction": prediction,
            "confidence": confidence,
            "feature_importances": feature_importances,
            "model_version": model_version
        }))
        
    except Exception as e:
        print(json.dumps({
            "status": "error",
            "message": str(e),
            "traceback": traceback.format_exc()
        }))

if __name__ == "__main__":
    main()

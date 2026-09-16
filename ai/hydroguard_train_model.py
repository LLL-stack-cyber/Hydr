import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

print("Loading Hardware-Matched HydroGuard Dataset...")
# 1. Load the new synthetic dataset we just generated
df = pd.read_csv('HydroGuard_Matched_Training_Data.csv')

# 2. Separate Features (X) and Labels (y)
# We drop 'timestamp' (not a number) and 'filter_condition' (the answer key)
# The remaining 12 columns become the hardware features the AI learns from.
X = df.drop(columns=['timestamp', 'filter_condition'])
y = df['filter_condition']

# 3. Split data into Training and Testing sets (80% train, 20% test)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

print("Training Random Forest Algorithm on 12 sensor features...")
# 4. Initialize the AI (100 decision trees)
model = RandomForestClassifier(n_estimators=100, random_state=42)

# 5. Train the AI on the data
model.fit(X_train, y_train)

# 6. Test the AI's accuracy
predictions = model.predict(X_test)
accuracy = accuracy_score(y_test, predictions)
print(f"\nModel Accuracy: {accuracy * 100:.2f}%")
print("\nClassification Report:")
print(classification_report(y_test, predictions))

# 7. Save the trained model to a file
joblib.dump(model, 'hydroguard_rf_model_v3.pkl')
print("\nModel saved successfully as 'hydroguard_rf_model_v3.pkl'")

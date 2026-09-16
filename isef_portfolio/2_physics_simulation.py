import numpy as np
import time

class FluidDynamicsSimulator:
    """
    Mathematical simulation of the physical HydroGuard 12V pump dynamics.
    Calculates the point at which increasing pipe friction (filter clogging)
    causes the 12V 4.6 LPM diaphragm pump to exceed its 60W (5A) power limit.
    """
    def __init__(self):
        # Electrical Constants
        self.VOLTAGE_V = 12.0
        self.MAX_POWER_W = 60.0
        self.MAX_CURRENT_A = self.MAX_POWER_W / self.VOLTAGE_V  # 5.0 Amps
        
        # Fluid Dynamics Constants
        self.NOMINAL_FLOW_LPM = 4.6
        self.PUMP_EFFICIENCY = 0.65
        self.BASE_SYSTEM_HEAD_M = 2.0 # Base elevation/pipe friction
        
    def simulate_degradation_cycle(self):
        print("=== HYDROGUARD PHYSICS SIMULATION INITIATED ===")
        print(f"System Limits: {self.VOLTAGE_V}V | {self.MAX_POWER_W}W | {self.MAX_CURRENT_A}A Max")
        
        # Time array simulating weeks of filter usage condensed into steps
        time_steps = np.arange(0, 100, 1) 
        
        for t in time_steps:
            # Model filter clogging: Head pressure increases exponentially over time
            filter_resistance_head_m = 0.1 * np.exp(0.05 * t)
            total_head_m = self.BASE_SYSTEM_HEAD_M + filter_resistance_head_m
            
            # Hydraulic Power (Watts) = (Density * g * Head * Flow_m3_s) 
            # Simplified pump load relation: Current draws proportionally to required torque (head pressure)
            # Assume base load is 1.5A at 2.0m head.
            base_current = 1.5
            current_draw_a = base_current * (total_head_m / self.BASE_SYSTEM_HEAD_M)
            
            # Calculate power
            power_w = self.VOLTAGE_V * current_draw_a
            
            # Actual flow degrades slightly as it approaches dead-head limits
            actual_flow_lpm = self.NOMINAL_FLOW_LPM * max(0.2, (1 - (current_draw_a / 10.0)))

            print(f"Step {t:03d} | Flow: {actual_flow_lpm:.2f} LPM | Head: {total_head_m:.2f} m | Current: {current_draw_a:.2f} A | Power: {power_w:.1f} W")
            
            # Safety Fault Trip Logic
            if current_draw_a > self.MAX_CURRENT_A:
                print("\n[CRITICAL FAULT] SYSTEM OVERLOAD TRIPPED!")
                print(f"Current draw ({current_draw_a:.2f}A) exceeded maximum limit ({self.MAX_CURRENT_A}A).")
                print("Pump shutdown initiated to prevent hardware damage.")
                break
                
            time.sleep(0.05)

if __name__ == "__main__":
    simulator = FluidDynamicsSimulator()
    simulator.simulate_degradation_cycle()

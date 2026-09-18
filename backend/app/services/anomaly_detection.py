class AnomalyDetector:
    @classmethod
    def detect(cls, historical_results: dict) -> dict:
        sample_size = historical_results.get("sample_size", 0)
        diff_pct = historical_results.get("difference_percentage", 0.0)
        
        if sample_size < 3:
            return {
                "status": "INSUFFICIENT_DATA",
                "confidence": "LOW",
                "reason": "Not enough historical price samples available for reliable seasonal comparison."
            }

        confidence = "HIGH" if sample_size >= 10 else "MEDIUM"

        if diff_pct <= -15.0:
            return {
                "status": "UNUSUALLY_LOW",
                "confidence": confidence,
                "reason": f"Offered price is {abs(diff_pct):.1f}% below the historical seasonal median."
            }
        elif diff_pct <= -5.0:
            return {
                "status": "BELOW_TYPICAL",
                "confidence": confidence,
                "reason": f"Offered price is {abs(diff_pct):.1f}% below typical historical prices."
            }
        else:
            return {
                "status": "NORMAL",
                "confidence": confidence,
                "reason": "Offered price aligns within the typical historical seasonal range."
            }

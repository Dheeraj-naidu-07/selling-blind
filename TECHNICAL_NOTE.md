# Technical Note - SELLING BLIND (Mandi Saathi) Decision Engine Architecture

## 1. Mathematical & Statistical Methodology

### A. Crop & Price Normalization
- All raw user inputs (e.g. `2,500 kg`, `₹18/kg`, `₹1800/qtl`) are normalized into standard units (`kg` and `₹/kg`).
- Historical AgMarkNet modal prices stored in `₹/Quintal` are divided by `100` to yield `₹/kg`.
- Crop names undergo string cleaning and alias mapping (`"pyaz"`, `"kanda"`, `"ullipaya"` -> `"Onion"`).

### B. Seasonal Historical Analysis
For a target crop $C$ and historical modal price samples $P = \{p_1, p_2, \dots, p_n\}$:
$$\text{Median}(P) = \begin{cases} p_{(n+1)/2} & \text{if } n \text{ is odd} \\ \frac{p_{n/2} + p_{n/2 + 1}}{2} & \text{if } n \text{ is even} \end{cases}$$

Percentage difference $\Delta\%$ from historical median:
$$\Delta\% = \left( \frac{P_{\text{offered}} - \text{Median}(P)}{\text{Median}(P)} \right) \times 100$$

Percentile rank $PR$:
$$PR = \left( \frac{\sum_{i=1}^n \mathbf{1}(p_i \le P_{\text{offered}})}{n} \right) \times 100$$

### C. Anomaly Detection Classification
- `UNUSUALLY_LOW`: $\Delta\% \le -15\%$
- `BELOW_TYPICAL`: $-15\% < \Delta\% \le -5\%$
- `NORMAL`: $\Delta\% > -5\%$
- `INSUFFICIENT_DATA`: $n < 3$

### D. Haversine Distance Formula
Given farmer coordinates $(\phi_1, \lambda_1)$ and candidate mandi coordinates $(\phi_2, \lambda_2)$:
$$a = \sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)$$
$$c = 2 \cdot \operatorname{atan2}\left(\sqrt{a}, \sqrt{1-a}\right)$$
$$d = R \cdot c \quad \text{where } R = 6371 \text{ km}$$

Candidate mandis are ranked by higher historical median price and proximity ($d \le 300\text{ km}$).

## 2. Decision Logic Hierarchy

```
                                [Farmer Offer Input]
                                         │
                         [Normalize Crop & Units (₹/kg)]
                                         │
                          [Query AgMarkNet History]
                                         │
                      [Calculate Median & Percentile]
                                         │
                      [Evaluate Anomaly Thresholds]
                                         │
             ┌───────────────────────────┴───────────────────────────┐
      Status == UNUSUALLY_LOW ?                                Status == NORMAL ?
             │                                                       │
             ▼                                                       ▼
   [Find Nearby Mandis (Haversine)]                               [Signal: SELL_NOW]
             │
   ┌─────────┴─────────┐
   │ Better Mandi?     │
   ▼                   ▼
[Signal:           [Signal:
 CONSIDER_         CONSIDER_
 ALTERNATIVE_      HOLDING]
 MANDI]
```

## 3. Responsible Use Disclosures & Limitations
- The system **never** guarantees price increases, profits, or future market outcomes.
- Plain-language signals inform farmers of historical public data trends (`"Historically recorded better prices during comparable periods"`).
- All API outputs append standard legal disclaimers.

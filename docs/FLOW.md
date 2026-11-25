# Gameplay flow (if/else)

Every death traces back to a cue the player missed. Yellow = decision, green = survive, red = death.

## Night loop

```mermaid
flowchart LR
    start(["12:00 AM - night starts"])
    listen["Listen for cues"]
    cue{"Threat cue heard?"}
    six{"Is it 6:00 AM?"}
    move["Move to that room"]
    counter{"Countered in time?"}
    reset["Entity resets or cools down 10 s"]
    dead(["Jumpscare - Game Over"])
    retry["Retry night or Main Menu"]
    win(["Bell rings - night complete"])
    save[("Autosave progress")]
    next["Next night unlocked"]
    start --> listen --> cue
    cue -->|"Yes"| move --> counter
    cue -->|"No"| six
    six -->|"No"| listen
    six -->|"Yes"| win --> save --> next
    counter -->|"Yes"| reset -.-> listen
    counter -->|"No"| dead --> retry -.-> start
    style cue fill:#FFECBD,stroke:#FFC943
    style six fill:#FFECBD,stroke:#FFC943
    style counter fill:#FFECBD,stroke:#FFC943
    style dead fill:#FFCDC2,stroke:#FF7556
    style win fill:#CDF4D3,stroke:#66D575
    style reset fill:#CDF4D3,stroke:#66D575
```

Threat director: at most one entity in its fatal state on Nights 1–3, at most two on Nights 4–5. Two cues never start in the same second.

## Kumot (bedroom) · Batibat

```mermaid
flowchart TD
    k1["Scuffs in hallway, wheeze at door (10 s to 5 s)"] --> k2{"Door shut and held when handle rattles?"}
    k2 -->|"Yes"| kOk(["She leaves"])
    k2 -->|"No"| k3["Door forced, she comes in"] --> k4{"Hiding under the bed?"}
    k4 -->|"No"| kDead(["Jumpscare"])
    k4 -->|"Yes"| k5{"Holding breath when blanket lifts? (max 8 s)"}
    k5 -->|"Yes"| kOk
    k5 -->|"No"| kDead
    classDef dec fill:#FFECBD,stroke:#FFC943
    classDef ok fill:#CDF4D3,stroke:#66D575
    classDef bad fill:#FFCDC2,stroke:#FF7556
    class k2,k4,k5 dec
    class kOk ok
    class kDead bad
```

## Malikmata (living room) · Tiyanak

```mermaid
flowchart TD
    m1["TV turns on, static swells (8 s to 4 s)"] --> m2{"TV off before static peaks?"}
    m2 -->|"Yes"| mOk(["He returns to the TV"])
    m2 -->|"No"| m3["He crosses out: giggle, VHS warble"] --> m4{"Lights off?"}
    m4 -->|"No"| mDead(["Jumpscare in 3 s"])
    m4 -->|"Yes"| m5{"Behind the sofa and not moving?"}
    m5 -->|"Yes"| mOk
    m5 -->|"No"| mDead
    classDef dec fill:#FFECBD,stroke:#FFC943
    classDef ok fill:#CDF4D3,stroke:#66D575
    classDef bad fill:#FFCDC2,stroke:#FF7556
    class m2,m4,m5 dec
    class mOk ok
    class mDead bad
```

Twist: lights off for too long makes the TV wake more often.

## Kalansing (kitchen) · Aswang

```mermaid
flowchart TD
    c1["Metal clinking gets louder (6 s to 3 s)"] --> c2{"Your noise low? Walk or crouch"}
    c2 -->|"Yes"| cOk(["She passes by"])
    c2 -->|"No"| c3["She enters the kitchen"] --> c4{"Hidden in cabinet or frozen?"}
    c4 -->|"No"| salt{"Throw asin (salt)?"}
    salt -->|"Yes"| cOk
    salt -->|"No"| cDead(["Jumpscare"])
    c4 -->|"Yes"| c5{"Still while she taps the doors? (or bottle cap thrown)"}
    c5 -->|"Yes"| cOk
    c5 -->|"No"| cDead
    classDef dec fill:#FFECBD,stroke:#FFC943
    classDef ok fill:#CDF4D3,stroke:#66D575
    classDef bad fill:#FFCDC2,stroke:#FF7556
    class c2,c4,c5,salt dec
    class cOk ok
    class cDead bad
```

## Silip (outside the curtain) · Manananggal

```mermaid
flowchart TD
    s1["Crickets and frogs go silent"] --> s2{"Flashlight on her 2 s at gate, tree or jar?"}
    s2 -->|"Yes"| sOk(["Pushed back one stage"])
    s2 -->|"No"| s3["Her face reaches the glass: fog, nail taps"] --> s4{"Curtain kept closed until fog fades?"}
    s4 -->|"Yes"| sOk2(["She retreats to the gate"])
    s4 -->|"No"| sDead(["Jumpscare"])
    classDef dec fill:#FFECBD,stroke:#FFC943
    classDef ok fill:#CDF4D3,stroke:#66D575
    classDef bad fill:#FFCDC2,stroke:#FF7556
    class s2,s4 dec
    class sOk,sOk2 ok
    class sDead bad
```

Curtain open for more than 6 s without the flashlight makes her advance faster. Rain on Night 5 hides the silence cue, so watch the fog on the glass.

## Night 5 finale

At 5:30 AM all four come to the bedroom, each through its own route: Kumot at the door, Malikmata through the phone screen, Kalansing under the floor, Silip at the bedroom window. Same rules, one room. At 5:59 the bell rings.

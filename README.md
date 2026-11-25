# Super Saiyan Bros. — Smocze Wyspy

Przeglądarkowa platformówka 2D z własnymi postaciami i oprawą. Pokonuj przeszkody, zbieraj smocze kule i używaj energii KI przeciw przeciwnikom.

## Uruchomienie lokalne

W katalogu repozytorium uruchom serwer i otwórz `http://localhost:8000/`.

```sh
python3 -m http.server 8000
```

## Sterowanie

| Klawisze | Akcja |
| --- | --- |
| `Enter` | Rozpoczęcie gry |
| `A` / `D` lub `←` / `→` | Ruch w lewo i w prawo |
| `W` lub `↑` | Skok |
| `S` lub `↓` | Szybkie opadanie |
| `Spacja` | Strzał KI w przemianie |
| `P` lub `Esc` | Pauza i wznowienie |

Smocza kula aktywuje przemianę i odblokowuje strzał KI. Grę można rozpocząć od nowa z menu pauzy. Na urządzeniach dotykowych pod planszą są drążek ruchu i przyciski skoku oraz ataku KI.

## Testy

Uruchom testy w Node.js 24.

```sh
node --test
```

## GitHub Pages

1. W ustawieniach repozytorium otwórz **Settings → Pages → Build and deployment** i wybierz **GitHub Actions** jako źródło.
2. Workflow **GitHub Pages** uruchomi się po zmianach na `main`. Możesz też uruchomić go ręcznie w zakładce **Actions**, wybierając gałąź `main`.
3. Po pomyślnym wdrożeniu gra będzie dostępna pod adresem [mellowrico.github.io/mario-dragon-ball](https://mellowrico.github.io/mario-dragon-ball/).

Workflow uruchamia testy, a potem publikuje `index.html` i katalog `game/`.

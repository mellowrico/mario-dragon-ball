# Super Saiyan Bros. — Smocze Wyspy

[Zagraj w Super Saiyan Bros.](https://mellowrico.github.io/mario-dragon-ball/)

Mario z fryzurą Goku ląduje na Smoczych Wyspach. Przeskocz cztery przepaście i pokonaj małe wersje Cella, Freezera i Buu, skacząc im na głowy. Siedem bloków ze znakiem zapytania kryje Smocze Kule. Już pierwsza powiększa bohatera i odblokowuje pociski ki. Celem jest flaga na końcu planszy.

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

Gra działa pod adresem [mellowrico.github.io/mario-dragon-ball](https://mellowrico.github.io/mario-dragon-ball/). Repozytorium publikuje katalog główny gałęzi `gh-pages` przez **Settings → Pages → Deploy from a branch**.

Po zmianie na `main` workflow **GitHub Pages** uruchamia testy mechaniki i sterowania oraz test w Chrome z widokiem desktopowym i mobilnym. Następnie synchronizuje pliki gry z gałęzią publikacji i zleca aktualizację GitHub Pages. Workflow można również uruchomić ręcznie z zakładki **Actions**.

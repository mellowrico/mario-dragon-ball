# Stan realizacji

| Etap | Kryterium odbioru | Weryfikacja | Następny krok na tym etapie |
| --- | --- | --- | --- |
| Plansza i mechanika | Ruch, skok na wroga, kula z bloku, wzrost, pocisk ki, meta | Symulacja przeszła całą planszę z trzema życiami, siedmioma kulami i aktywnym punktem kontrolnym. | Połączyć silnik z grafiką i wejściem. |
| Sterowanie i oprawa | Klawiatura oraz drążek i dwa niezależne przyciski dotykowe | Testy wejścia sprawdziły m.in. równoczesne dotknięcia, anulowanie gestu i krótkie naciśnięcia. Sprawdzono renderowanie planszy w Chromium. | Sprawdzić integrację i ścieżki publikacji. |
| Publikacja | Gra dostępna publicznie w katalogu projektu GitHub Pages | 13 adresów sprawdzonych pod prefiksem projektu. GitHub potwierdził pierwsze wdrożenie z gałęzi gh-pages. | Zweryfikować w CI pełną rozgrywkę, interfejs desktopowy i mobilny oraz kolejne wdrożenie. |

Pierwsze wdrożenie: https://github.com/mellowrico/mario-dragon-ball/actions/runs/45605805614

## Odbiór końcowy

Wersja `86fb146` przeszła 12 testów Node.js i oba scenariusze przeglądarkowe. Chrome sprawdził start, ruch i skok po monetę, działanie wyniku, pauzę, wznowienie oraz restart. W widoku telefonu 390 × 844 test wysłał równoczesne dotknięcia na drążku i przycisku skoku. GitHub opublikował grę z gałęzi `gh-pages`. Runner porównał treść publicznego `index.html` z wersją w repozytorium i odczytał identyfikator wdrożenia z publicznego `version.txt`. Wszystkie kryteria odbioru spełnione.

[Testy i potwierdzenie publikacji](https://github.com/mellowrico/mario-dragon-ball/actions/runs/45606525175)

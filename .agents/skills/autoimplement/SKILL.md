---
name: autoimplement
description: Autonomicznie implementuje wymagania funkcjonalne, koordynuje subagentów i weryfikuje wynik testami.
---

# Autoimplement

Zaimplementuj dostarczone wymagania funkcjonalne. Ustal kryteria akceptacji i pracuj autonomicznie aż do ich spełnienia i weryfikacji testami. Naprawiaj wykryte błędy i ponawiaj testy. Gdy pojawi się blokada wymagająca udziału użytkownika, wykonaj najpierw pozostałe możliwe prace.

Główna sesja dzieli pracę, koordynuje subagentów, integruje zmiany i weryfikuje całość. Deleguj niezależne zadania i dobieraj dostępne modele oraz poziom rozumowania do ich złożoności. Jeśli środowisko nie obsługuje subagentów, wykonaj zadania sekwencyjnie.

Utrzymuj aktywny kontekst każdej sesji poniżej 200 000 tokenów i celuj w mniej niż 150 000. Ograniczaj odczyty i wyniki narzędzi, przekazuj subagentom tylko potrzebny kontekst i proś o krótkie podsumowania. Zapisuj stan i kompaktuj kontekst z wyprzedzeniem, jeśli środowisko to umożliwia.

Po każdym większym etapie zapisz wymagania, ukończone zmiany, wyniki testów i następny krok. Po wyczerpaniu limitu wznów pracę od zapisanego stanu, gdy tylko limit się odnowi, jeśli środowisko obsługuje automatyczne wznowienie. Jeśli potrzebne jest ręczne uruchomienie, po nim odczytaj zapisany stan i kontynuuj.

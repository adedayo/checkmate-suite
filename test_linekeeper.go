package main

import (
	"fmt"
	"sort"
	"sync"
)

type Position struct {
	Line      int64
	Character int64
}

type LineKeeper struct {
	EOLLocations []int // end-of-line locations
	lock         sync.Mutex
}

func (lk *LineKeeper) appendEOLs(eols []int) {
	sorted := sort.IntSlice(eols)
	lk.lock.Lock()
	if len(lk.EOLLocations) > 0 {
		last := lk.EOLLocations[len(lk.EOLLocations)-1]
		for i := range sorted {
			sorted[i] += last + 1
		}
	}
	lk.EOLLocations = append(lk.EOLLocations, sorted...)
	lk.lock.Unlock()
}

func (lk *LineKeeper) GetPositionFromCharacterIndex(pos int64) Position {
	lk.lock.Lock()
	defer lk.lock.Unlock()
	if len(lk.EOLLocations) > 0 {
		end := int64(len(lk.EOLLocations) - 1)
		if pos > int64(lk.EOLLocations[end]) {
			return Position{
				Line:      end + 1,
				Character: pos - int64(lk.EOLLocations[end]) - 1,
			}
		}
		for i, eol := range lk.EOLLocations {
			if int64(eol) >= pos {
				if i > 0 {
					return Position{
						Line:      int64(i),
						Character: pos - int64(lk.EOLLocations[i-1]) - 1,
					}
				}
				break
			}
		}
	}
	return Position{
		Line:      0,
		Character: pos,
	}
}

func main() {
	lk := &LineKeeper{}
	
	// String: "abc\ndef\nghi"
	// Indices:
	// 0: a, 1: b, 2: c, 3: \n
	// 4: d, 5: e, 6: f, 7: \n
	// 8: g, 9: h, 10: i
	
	lk.appendEOLs([]int{3}) // 1st chunk "abc\n"
	lk.appendEOLs([]int{3}) // 2nd chunk "def\n"
	
	fmt.Printf("EOL Locations: %v\n", lk.EOLLocations)
	
	tests := []struct{
		pos int64
		expected Position
	}{
		{0, Position{0, 0}}, // a
		{3, Position{0, 3}}, // \n
		{4, Position{1, 0}}, // d
		{5, Position{1, 1}}, // e
		{7, Position{1, 3}}, // \n
		{8, Position{2, 0}}, // g
		{9, Position{2, 1}}, // h
	}
	
	for _, tc := range tests {
		got := lk.GetPositionFromCharacterIndex(tc.pos)
		if got != tc.expected {
			fmt.Printf("FAIL for pos %d: expected %v, got %v\n", tc.pos, tc.expected, got)
		} else {
			fmt.Printf("PASS for pos %d: %v\n", tc.pos, got)
		}
	}
}

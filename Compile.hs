module Compile where

-- import Control.Monad

main = do
  src <- readFile "LURKLEY.BASIC"
  let contents = lineStart "" (lines src)
  print $ (check 0 contents :: [String])

lineStart l [] = [l]
lineStart l (x:xs) | length x < 32 = blank (l++x) xs
                   | otherwise = lineContOrBlank (l++x) xs

blank l [] = [l]
blank l ("":xs) = l : lineStart "" xs
blank l (x:_) = error $ "blank expected after " ++ show l ++ " but found " ++ show x

lineContOrBlank l [] = [l]
lineContOrBlank l ("":xs) = l : lineStart "" xs
lineContOrBlank l (x:xs) | length x < 32 = blank (l++x) xs
                         | otherwise = lineContOrBlank (l++x) xs

check _ [] = []
check i (x:xs) =
  case lex x of
    [(num,_)] ->
      let n = read num in
      if i < n then check n xs else error $ "out of order: " ++ show n ++ " comes before " ++ show i
    z -> error $ show x ++ " lexed into " ++ show z

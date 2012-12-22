module Compile where

main = do
  src <- readFile "LURKLEY.BASIC"
  forM_ (lineStart [] "" (lines src)) putStrLn

lineStart l [] = [l]
lineStart l (x:xs) | length x < 32 = blank (l++x) xs
                   | otherwise = lineContOrBlank (l++x) xs

blank l [] = [l]
blank l ("":xs) = l : lineStart "" xs
blank l (x:xs) = error $ "blank expected after " ++ show l ++ " but found " ++ show x

lineContOrBlank l [] = [l]
lineContOrBlank l ("":xs) = l : lineStart "" xs
lineContOrBlank l (x:xs) | length x < 32 = blank (l++x) xs
                         | otherwise = lineContOrBlank (l++x) xs

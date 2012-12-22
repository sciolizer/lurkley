module Main where

import Data.Char
import Data.List
import Data.Maybe

import Compile

main = do
  ls <- parseFile
  wBasicLines ls

wBasicLines bls = do
  w "var program = {\n"
  mapM_ (uncurry wBasicLine) (zip bls ([Just i | BasicLine i _ <- tail bls] ++ [Nothing]))
  w "};"

wBasicLine (BasicLine ln cmds) nextLn = go (zip cmds [0..]) where
  go [] = error "line has no commands"
  go ((cmd,suffix):cmds) = do
    w "  line"
    w (show ln)
    w "_"
    w (show suffix)
    w ": function(basic) { "
    wCommand cmd
    case nextLn of
      Nothing -> w "basic._quit(); }\n"
      Just nln -> do
        w "basic._next(program.line"
        if null cmds
          then do w (show nln)
                  w "_0"
          else do w (show ln)
                  w "_"
                  w (show (suffix + 1))
        w "); },\n"
        go cmds

orElse :: Maybe Expr -> Integer -> W ()
orElse mb x = wExpr (fromMaybe (LiteralNumber (Left x)) mb)

wCommand cmd =
  case cmd of
    Assign var mbIndex val -> do
      case mbIndex of
        Nothing -> wBasic "assign" [w (show var), wExpr val]
        Just ind -> wBasic "assignArr" [w (show var), wExpr ind, wExpr val]
    Circle (x, y) rad mb1 mbElX mbElY mb4 ->
      wBasic "circle" [wExpr x, wExpr y, wExpr rad, mb1 `orElse` 0 {- todo -}, mbElX `orElse` 0 {- todo -}, mbElY `orElse` 0 {- todo -}, mb4 `orElse` 0 {- todo -}]
    Clear e -> wBasic "clear" [wExpr e]
    Color c1 c2 -> wBasic "color" (map wExpr [c1, c2])
    Dim decls -> mapM_ (\(var,dim) -> wBasic "dim" [w (show var), wArray (map (wExpr . LiteralNumber . Left . toInteger) dim)]) decls
    Draw e -> wBasic "draw" [wExpr e]
    For var start end mbStep -> wBasic "for" [w (show var), wExpr start, wExpr end, mbStep `orElse` 1]
    Get Nothing (x2,y2) var -> wBasic "getTo" [wExpr x2, wExpr y2, w (show var)]
    Get (Just (x1, y1)) (x2,y2) var -> wBasic "get" [wExpr x1, wExpr y1, wExpr x2, wExpr y2, w (show var)]
    Gosub i -> wBasic "gosub" [w (show i)]
    Goto i -> wBasic "goto" [w (show i)]
    If be thenC elseC -> do
      w "if ("
      wBooleanExpr be
      w ") { "
      let normalize (Left i) = Goto i
          normalize (Right r) = r
      wCommand (normalize thenC)
      w " } "
      case elseC of
        Nothing -> return ()
        Just z -> do
          w "else { "
          wCommand (normalize z)
          w " } "
    Line Nothing (x2,y2) dm lm -> wBasic "lineTo" [wExpr x2, wExpr y2, w (show (drawMode dm)), w (show (lineMode lm))]
    Line (Just (x1,y1)) (x2,y2) dm lm -> wBasic "line" [wExpr x1, wExpr y1, wExpr x2, wExpr y2, w (show (drawMode dm)), w (show (lineMode lm))]
    Next mbVar -> wBasic "next" [w $ show (fromMaybe "" mbVar)]
    On var mode lns -> wBasic func [w (show var), wArray (map (w . show) lns)] where
      func = case mode of { JumpGoto -> "onGoto"; JumpGosub -> "onGosub" }
    Paint (x,y) e1 e2 -> wBasic "paint" (map wExpr [x, y, e1, e2])
    Pcls mbClr -> wBasic "pcls" [mbClr `orElse` 0 {- todo -}]
    Play e -> wBasic "play" [wExpr e]
    Pmode e1 e2 -> wBasic "pmode" (map wExpr [e1, e2])
    Poke e1 e2 -> wBasic "poke" (map wExpr [e1, e2])
    Pset (x,y) clr -> wBasic "pset" (map wExpr [x, y, clr])
    Put Nothing (x2,y2) var -> wBasic "putTo" [wExpr x2, wExpr y2, w (show var)]
    Put (Just (x1,y1)) (x2,y2) var -> wBasic "put" [wExpr x1, wExpr y1, wExpr x2, wExpr y2, w (show var)]
    Rem s -> w "/* " >> w s >> w " */ "
    Return -> wBasic "return" []
    Screen e1 e2 -> wBasic "screen" (map wExpr [e1, e2])
    Sound e1 e2 -> wBasic "sound" (map wExpr [e1, e2])

drawMode DrawPset = "pset"
drawMode DrawPreset = "preset"

lineMode LineLine = ""
lineMode LineBox = "b"
lineMode LineBoxFilled = "bf"

wBasic :: String -> [W ()] -> W ()
wBasic method args = do
  w "basic."
  w method
  w "("
  sequence_ (intersperse (w ", ") args) 
  w "); "

wArray arr = do
  w "["
  sequence_ (intersperse (w ", ") arr)
  w "]"

wBooleanExpr be = z where
  z =
    case be of
      (Compare cmp l r) -> wComparison cmp l r
      And l r -> combine "&&" l r
      Or l r -> combine "||" l r
  combine op l r = wBinary wBooleanExpr op l r

wBinary we op l r = do
  w "("
  we l
  w ") "
  w op
  w " ("
  we r
  w ")"

wComparison cmp l r = z where
  z = wBasic (name cmp) (map wExpr [l, r])
  name cmp = downcase (show cmp)
  downcase "" = ""
  downcase (x:xs) = toLower x : xs

wExpr e =
  case e of
    Variable s Nothing -> wBasic "recall" [w (show s)]
    Variable s (Just ind) -> wBasic "recallArr" [w (show s), wExpr ind]
    LiteralString s -> w (show s)
    LiteralNumber (Left i) -> w (show i)
    LiteralNumber (Right f) -> w (show f)
    Add e1 e2 -> wBinary wExpr "+" e1 e2
    Subtract e1 e2 -> wBinary wExpr "-" e1 e2
    Multiply e1 e2 -> wBinary wExpr "*" e1 e2
    Divide e1 e2 -> wBinary wExpr "/" e1 e2
    Inkey -> wBasic "inkey" []
    Len var -> wBasic "len" [w (show var)]
    Function bi args -> wBasic (builtInLib bi) (map wExpr args)

builtInLib :: BuiltIn -> String
builtInLib bi = z where
  (x:xs) = show bi
  z = case last xs of
        'S' -> toLower x : init xs
        _ -> toLower x : xs

type W = IO

w :: String -> W ()
w = putStr
